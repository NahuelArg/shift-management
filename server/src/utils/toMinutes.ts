export function toMinutes(time: string): number {
    const numbers = time.split(':').map(Number)
    const minutes= numbers[0] * 60 + numbers[1]
    return minutes
}