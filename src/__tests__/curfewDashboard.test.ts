describe('CurfewDashboard Unified Flow & Days Summary', () => {
  const getDaysSummary = (activeDays: number[]) => {
    return activeDays.length === 7
      ? 'Every day'
      : activeDays.length === 5 &&
        !activeDays.includes(6) &&
        !activeDays.includes(7)
      ? 'Weekdays'
      : activeDays.length === 2 &&
        activeDays.includes(6) &&
        activeDays.includes(7)
      ? 'Weekends'
      : `${activeDays.length} of 7 days`;
  };

  it('formats every day correctly', () => {
    expect(getDaysSummary([1, 2, 3, 4, 5, 6, 7])).toBe('Every day');
  });

  it('formats weekdays correctly', () => {
    expect(getDaysSummary([1, 2, 3, 4, 5])).toBe('Weekdays');
  });

  it('formats weekends correctly', () => {
    expect(getDaysSummary([6, 7])).toBe('Weekends');
  });

  it('formats custom days correctly', () => {
    expect(getDaysSummary([1, 3, 5])).toBe('3 of 7 days');
  });
});
