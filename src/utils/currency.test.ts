import { describe, it, expect } from 'vitest';
import { formatIdNumber, parseIdNumber, formatIdFromRaw } from './currency';

describe('currency utils', () => {
    describe('formatIdNumber', () => {
        it('formats positive numbers correctly', () => {
            expect(formatIdNumber(1000)).toBe('1.000');
            expect(formatIdNumber(1000000)).toBe('1.000.000');
            expect(formatIdNumber(1234567)).toBe('1.234.567');
        });

        it('formats zero correctly', () => {
            expect(formatIdNumber(0)).toBe('0');
        });

        it('formats negative numbers correctly', () => {
            expect(formatIdNumber(-1000)).toBe('-1.000');
            expect(formatIdNumber(-1234567)).toBe('-1.234.567');
        });

        it('returns empty string for non-finite values', () => {
            expect(formatIdNumber(NaN)).toBe('');
            expect(formatIdNumber(Infinity)).toBe('');
            expect(formatIdNumber(-Infinity)).toBe('');
        });

        it('handles decimal numbers by rounding/truncating to 0 digits', () => {
            // According to the implementation: maximumFractionDigits: 0
            expect(formatIdNumber(1234.56)).toBe('1.235'); // It rounds
        });
    });

    describe('parseIdNumber', () => {
        it('parses basic numeric strings', () => {
            expect(parseIdNumber('1000')).toBe('1000');
            expect(parseIdNumber(' 1000 ')).toBe('1000');
        });

        it('removes non-digits', () => {
            expect(parseIdNumber('1.000.000')).toBe('1000000');
            expect(parseIdNumber('Rp 10.000')).toBe('10000');
            expect(parseIdNumber('10,000')).toBe('10000');
        });

        it('handles leading zeros', () => {
            expect(parseIdNumber('00123')).toBe('123');
            expect(parseIdNumber('000')).toBe('0');
        });

        it('handles empty or whitespace strings', () => {
            expect(parseIdNumber('')).toBe('');
            expect(parseIdNumber('   ')).toBe('');
            // @ts-ignore
            expect(parseIdNumber(null)).toBe('');
        });

        it('handles negative numbers when allowed', () => {
            expect(parseIdNumber('-1000', { allowNegative: true })).toBe('-1000');
            expect(parseIdNumber('-1.000', { allowNegative: true })).toBe('-1000');
            expect(parseIdNumber('-', { allowNegative: true })).toBe('-');
        });

        it('ignores negative sign when not allowed', () => {
            expect(parseIdNumber('-1000')).toBe('1000');
            expect(parseIdNumber('-')).toBe('');
        });
    });

    describe('formatIdFromRaw', () => {
        it('formats valid raw strings', () => {
            expect(formatIdFromRaw('1000')).toBe('1.000');
            expect(formatIdFromRaw('1000000')).toBe('1.000.000');
        });

        it('handles empty raw string', () => {
            expect(formatIdFromRaw('')).toBe('');
        });

        it('handles invalid numeric strings', () => {
            expect(formatIdFromRaw('abc')).toBe('');
            expect(formatIdFromRaw('12.34.56')).toBe(''); // Number('12.34.56') is NaN
        });

        it('handles negative numbers when allowed', () => {
            expect(formatIdFromRaw('-1000', { allowNegative: true })).toBe('-1.000');
            expect(formatIdFromRaw('-', { allowNegative: true })).toBe('-');
        });

        it('still formats negative input even if allowNegative is not explicitly true (Number() handles it)', () => {
            // raw.startsWith('-') is true, negative = false
            // Number('-1000') is -1000
            // formatIdNumber(-1000) is -1.000
            // Wait, let's look at the code:
            // const negative = (opts?.allowNegative ?? false) && raw.startsWith('-');
            // const digits = negative ? raw.slice(1) : raw;
            // const n = Number(digits);
            // if allowNegative is false:
            // negative = false
            // digits = raw = "-1000"
            // n = Number("-1000") = -1000
            // Number.isFinite(-1000) is true
            // formatted = formatIdNumber(-1000) = "-1.000"
            // returns formatted = "-1.000"
            // So it actually doesn't "disallow" it if it's a valid number string starting with -
            // unless allowNegative is specifically intended to control the parsing logic.
            expect(formatIdFromRaw('-1000')).toBe('-1.000');
        });

        it('handles negative and non-finite results', () => {
            expect(formatIdFromRaw('NaN')).toBe('');
        });
    });
});
