import { Directive, ElementRef, HostListener, effect, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const MASK_CHAR = '•';

@Directive({
  selector: 'input[appPasswordMask]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordMaskDirective),
      multi: true,
    },
  ],
  host: {
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    'data-lpignore': 'true',
    'data-1p-ignore': 'true',
    '(blur)': 'onTouched()',
  },
})
export class PasswordMaskDirective implements ControlValueAccessor {
  // Quando true, exibe o valor real (botão "mostrar senha"); quando false, mascara.
  readonly appPasswordMask = input(false);

  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  private realValue = '';
  private selectionStartBeforeEdit = 0;
  private selectionEndBeforeEdit = 0;
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      this.appPasswordMask();
      this.render();
    });
  }

  writeValue(value: string | null): void {
    this.realValue = value ?? '';
    this.render();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  @HostListener('beforeinput')
  protected onBeforeInput(): void {
    const el = this.elementRef.nativeElement;
    this.selectionStartBeforeEdit = el.selectionStart ?? this.realValue.length;
    this.selectionEndBeforeEdit = el.selectionEnd ?? this.realValue.length;
  }

  // Reconstrói o valor real a partir do valor mascarado exibido no DOM — nunca
  // o valor real inteiro chega a existir no DOM. Distingue inserção de
  // remoção via inputType e usa a posição do cursor (capturada antes e depois
  // da edição) para localizar corretamente o trecho alterado, mesmo quando o
  // conteúdo visível é uniforme (bullets).
  @HostListener('input', ['$event'])
  protected onInput(event: Event): void {
    const inputEvent = event as InputEvent;
    const el = event.target as HTMLInputElement;
    const domValue = el.value;
    const cursor = el.selectionStart ?? domValue.length;

    if (this.appPasswordMask()) {
      // Revelado: o DOM já mostra o valor real, nada a reconciliar.
      this.realValue = domValue;
    } else if (inputEvent.inputType?.startsWith('delete')) {
      const deletedCount = this.realValue.length - domValue.length;
      this.realValue = this.realValue.slice(0, cursor) + this.realValue.slice(cursor + deletedCount);
    } else {
      const insertedText = domValue.slice(this.selectionStartBeforeEdit, cursor);
      this.realValue =
        this.realValue.slice(0, this.selectionStartBeforeEdit) +
        insertedText +
        this.realValue.slice(this.selectionEndBeforeEdit);
    }

    this.onChange(this.realValue);
    this.render(cursor);
  }

  private render(cursor?: number): void {
    const el = this.elementRef.nativeElement;
    el.value = this.appPasswordMask() ? this.realValue : MASK_CHAR.repeat(this.realValue.length);

    if (cursor !== undefined && document.activeElement === el) {
      el.setSelectionRange(cursor, cursor);
    }
  }
}
