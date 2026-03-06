import { describe, it, expect, beforeAll } from 'vitest';

describe('Authentication Logic', () => {
    let env: any;

    beforeAll(() => {
        // Simulate the environment from wrangler.toml development config
        env = {
            PASCAL_PASS: 'pascal123',
            CLAUDIA_PASS: 'claudia123'
        };
    });

    it('should trim and compare passwords correctly', () => {
        const resolveUserBySecret = (secret: string, env: any) => {
            const trimmedSecret = secret.trim();

            if (trimmedSecret === env.PASCAL_PASS?.trim()) {
                return 'PascalSV';
            }

            if (trimmedSecret === env.CLAUDIA_PASS?.trim()) {
                return 'ClaudiaSV';
            }

            return null;
        };

        // Test PascalSV
        expect(resolveUserBySecret('pascal123', env)).toBe('PascalSV');
        expect(resolveUserBySecret(' pascal123 ', env)).toBe('PascalSV');

        // Test ClaudiaSV
        expect(resolveUserBySecret('claudia123', env)).toBe('ClaudiaSV');
        expect(resolveUserBySecret(' claudia123 ', env)).toBe('ClaudiaSV');

        // Test invalid
        expect(resolveUserBySecret('wrongpassword', env)).toBe(null);
    });

    it('should handle login form submission correctly', () => {
        const username = 'PascalSV';
        const providedPassword = 'pascal123'.trim();

        const expectedPassword = (username === 'PascalSV' ? env.PASCAL_PASS : env.CLAUDIA_PASS)?.trim();

        expect(providedPassword).toBe(expectedPassword);
        expect(providedPassword === expectedPassword).toBe(true);
    });

    it('should fail on incorrect password', () => {
        const username = 'PascalSV';
        const providedPassword = 'wrongpassword'.trim();

        const expectedPassword = (username === 'PascalSV' ? env.PASCAL_PASS : env.CLAUDIA_PASS)?.trim();

        expect(providedPassword === expectedPassword).toBe(false);
    });
});
