// 18:00 -> ["18", "00"] -> [18, 00]

function convertHoursStringToMinutes(hoursString: string) {
  const [hours, minutes] = hoursString.split(':').map(Number);

  const minutesAmount = (hours * 60) + minutes.toString();
  
  return minutesAmount;
}