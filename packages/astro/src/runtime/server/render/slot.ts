import type { SSRResult } from '../../../@types/astro.js';
import type { renderTemplate } from './astro/render-template.js';
import type { RenderInstruction } from './instruction.js';

import { HTMLString, markHTMLString } from '../escape.js';
import { renderChild } from './any.js';
import { chunkToString, type RenderDestination, type RenderInstance } from './common.js';

type RenderTemplateResult = ReturnType<typeof renderTemplate>;
export type ComponentSlots = Record<string, ComponentSlotValue>;
export type ComponentSlotValue = (
	result: SSRResult,
	context: Record<string | symbol | number, unknown>
) => RenderTemplateResult | Promise<RenderTemplateResult>;

const slotString = Symbol.for('astro:slot-string');

export class SlotString extends HTMLString {
	public instructions: null | RenderInstruction[];
	public [slotString]: boolean;
	constructor(content: string, instructions: null | RenderInstruction[]) {
		super(content);
		this.instructions = instructions;
		this[slotString] = true;
	}
}

export function isSlotString(str: string): str is any {
	return !!(str as any)[slotString];
}

export function renderSlot(
	result: SSRResult,
	slotted: ComponentSlotValue | RenderTemplateResult,
	context: Record<string | symbol | number, unknown>
): RenderInstance {
	return {
		async render(destination) {
			const child = typeof slotted === 'function' ? slotted(result, context) : slotted
			await renderChild(destination, child);
		},
	};
}

export async function renderSlotToString(
	result: SSRResult,
	slotted: ComponentSlotValue | RenderTemplateResult,
	context: Record<string  | symbol | number, unknown>
): Promise<string> {
	let content = '';
	let instructions: null | RenderInstruction[] = null;
	const temporaryDestination: RenderDestination = {
		write(chunk) {
			if (chunk instanceof Response) return;
			if (typeof chunk === 'object' && 'type' in chunk && typeof chunk.type === 'string') {
				if (instructions === null) {
					instructions = [];
				}
				instructions.push(chunk);
			} else {
				content += chunkToString(result, chunk);
			}
		},
	};
	const renderInstance = renderSlot(result, slotted, context);
	await renderInstance.render(temporaryDestination);
	return markHTMLString(new SlotString(content, instructions));
}

interface RenderSlotsResult {
	slotInstructions: null | RenderInstruction[];
	children: Record<string, string>;
}

export async function renderSlots(
	result: SSRResult,
	slots: ComponentSlots = {},
	context: Record<string | symbol | number, unknown>
): Promise<RenderSlotsResult> {
	let slotInstructions: RenderSlotsResult['slotInstructions'] = null;
	let children: RenderSlotsResult['children'] = {};
	if (slots) {
		await Promise.all(
			Object.entries(slots).map(([key, value]) =>
				renderSlotToString(result, value, context).then((output: any) => {
					if (output.instructions) {
						if (slotInstructions === null) {
							slotInstructions = [];
						}
						slotInstructions.push(...output.instructions);
					}
					children[key] = output;
				})
			)
		);
	}
	return { slotInstructions, children };
}
