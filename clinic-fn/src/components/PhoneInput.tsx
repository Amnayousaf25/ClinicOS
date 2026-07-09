import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  placeholder: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'AU', name: 'Australia', dialCode: '+61', minLength: 9, maxLength: 9, placeholder: '400 000 000', flag: '🇦🇺' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', minLength: 10, maxLength: 10, placeholder: '300 1234567', flag: '🇵🇰' },
  { code: 'US', name: 'United States', dialCode: '+1', minLength: 10, maxLength: 10, placeholder: '201 555 0123', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', minLength: 10, maxLength: 10, placeholder: '7911 123456', flag: '🇬🇧' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  name?: string;
  error?: string;
  touched?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const PhoneInput = ({
  value = '',
  onChange,
  onBlur,
  name,
  error,
  touched,
  className = '',
  placeholder,
  label,
  required,
}: PhoneInputProps) => {
  // Parse initial value
  const parseValue = (val: string) => {
    const matched = COUNTRIES.find((c) => val.startsWith(c.dialCode));
    if (matched) {
      const local = val.slice(matched.dialCode.length).replace(/\D/g, '');
      return { country: matched, local };
    }
    // Fallback to default country (AU)
    const defaultCountry = COUNTRIES[0];
    const cleanVal = val.replace(/\D/g, '');
    // If val already starts with 61, etc.
    const pkClean = cleanVal.startsWith('61') ? cleanVal.slice(2) : cleanVal;
    return { country: defaultCountry, local: pkClean };
  };

  const initial = parseValue(value);
  const [selectedCountry, setSelectedCountry] = useState<Country>(initial.country);
  const [localNumber, setLocalNumber] = useState<string>(initial.local);

  useEffect(() => {
    const parsed = parseValue(value);
    setSelectedCountry(parsed.country);
    setLocalNumber(parsed.local);
  }, [value]);

  const handleCountryChange = (code: string) => {
    const nextCountry = COUNTRIES.find((c) => c.code === code);
    if (nextCountry) {
      setSelectedCountry(nextCountry);
      // Trim local number if it exceeds new country's max length
      const nextLocal = localNumber.slice(0, nextCountry.maxLength);
      setLocalNumber(nextLocal);
      onChange(`${nextCountry.dialCode}${nextLocal}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // numbers only
    const digits = e.target.value.replace(/\D/g, '');
    const limited = digits.slice(0, selectedCountry.maxLength);
    setLocalNumber(limited);
    onChange(`${selectedCountry.dialCode}${limited}`);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required ? ' *' : ''}
        </Label>
      )}
      <div className="flex gap-2">
        <Select
          value={selectedCountry.code}
          onValueChange={handleCountryChange}
        >
          <SelectTrigger className="w-[100px] shrink-0 rounded-xl bg-background border border-input">
            <SelectValue placeholder="Flag" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="mr-1.5">{c.flag}</span>
                <span>{c.dialCode}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={name}
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localNumber}
          onChange={handleInputChange}
          onBlur={onBlur}
          placeholder={placeholder || selectedCountry.placeholder}
          className="flex-1 rounded-xl bg-background border border-input"
        />
      </div>
      {touched && error && (
        <p className="text-xs text-destructive mt-1 font-medium">{error}</p>
      )}
    </div>
  );
};
