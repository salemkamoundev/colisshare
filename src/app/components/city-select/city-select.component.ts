import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TUNISIA_CITIES } from '../../data/tunisia-cities';

@Component({
  selector: 'app-city-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <label *ngIf="label" class="block text-sm font-medium text-gray-700 mb-1">
        {{ icon }} {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>
      
      <input
        type="text"
        [value]="value"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        [placeholder]="placeholder"
        [disabled]="disabled"
        class="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        autocomplete="off"
      />

      <!-- Dropdown avec résultats -->
      <div
        *ngIf="showDropdown && filteredCities.length > 0"
        class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
      >
        <div
          *ngFor="let city of filteredCities"
          (mousedown)="selectCity(city)"
          class="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm transition-colors"
          [class.bg-blue-100]="city === value"
        >
          {{ city }}
        </div>
      </div>

      <!-- Message aucun résultat -->
      <div
        *ngIf="showDropdown && filteredCities.length === 0 && value"
        class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-3 text-center text-gray-500 text-sm"
      >
        Aucune ville trouvée pour "{{ value }}"
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CitySelectComponent),
      multi: true,
    },
  ],
})
export class CitySelectComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() placeholder = 'Rechercher une ville...';
  @Input() icon = '🏙️';
  @Input() required = false;

  value = '';
  allCities = TUNISIA_CITIES;
  filteredCities: string[] = [];
  showDropdown = false;
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.filteredCities = this.allCities;
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.filterCities(this.value);
    this.onChange(this.value);
  }

  onFocus(): void {
    this.showDropdown = true;
    this.filterCities(this.value);
  }

  onBlur(): void {
    // Délai pour permettre le clic sur un élément
    setTimeout(() => {
      this.showDropdown = false;
      this.onTouched();
    }, 200);
  }

  filterCities(searchText: string): void {
    if (!searchText || searchText.trim() === '') {
      this.filteredCities = this.allCities;
      return;
    }

    const search = searchText.toLowerCase().trim();
    this.filteredCities = this.allCities.filter((city) =>
      city.toLowerCase().includes(search)
    );
  }

  selectCity(city: string): void {
    this.value = city;
    this.onChange(city);
    this.showDropdown = false;
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    this.value = value || '';
    this.filterCities(this.value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
