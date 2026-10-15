"use strict";
// 18:00 -> ["18", "00"] -> [18, 00] -> 1080
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertHourStringToMinutes = convertHourStringToMinutes;
function convertHourStringToMinutes(hoursString) {
    const [hours, minutes] = hoursString.split(':').map(Number);
    const minutesAmount = (hours * 60) + minutes;
    return minutesAmount;
}
