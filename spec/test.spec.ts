describe('First suites @testId:67554', () => {
    it('FIrst step', () => {
        expect(true).toBe(true);
    });
    it('second', () => {
        expect(false).toBeFalsy();
    });
    it('Third', () => {
        expect('jasmine-zephyr-reporter').toContain('zephyr');
    });
    it('Forth', () => {
        expect('a').toEqual('a');
    });
    it('fifth', () => {
        expect(7).toBeGreaterThan(5);
    });
    it('The last one', () => {
        expect('a').toBe('a');
    });
})