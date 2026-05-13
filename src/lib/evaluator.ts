export class Evaluator {
  evaluate(transcript: string, expectedPhrases: string[], allowPartial = false): { success: boolean; score: number; matches: string[] } {
    // Simple substring inclusion check
    const lower = transcript.toLowerCase();
    for (const phrase of expectedPhrases) {
      if (lower.includes(phrase.toLowerCase())) {
        return { success: true, score: 1.0, matches: [phrase] };
      }
    }
    return { success: false, score: 0, matches: [] };
  }
}
