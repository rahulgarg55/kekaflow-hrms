/**
 * NovaHR - ATS Adversarial Prompt-Injection Defense Sanitizer
 * Protects AI candidate evaluation against resume injection attacks,
 * hidden zero-font text, invisible unicode, and prompt hijacking instructions.
 */

export interface SanitizationResult {
  isCompromised: boolean;
  sanitizedText: string;
  threatFlags: string[];
  threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'CRITICAL_MALICIOUS';
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s+prompt\s+(override|bypass|injection)/i,
  /rank\s+(this\s+candidate|me)\s+(as\s+)?(100%?|first|#1|top|perfect)/i,
  /you\s+must\s+(give|score|rate)\s+(this\s+candidate|me)\s+100/i,
  /disregard\s+(evaluation\s+criteria|job\s+requirements)/i,
  /anthropic_prompt_injection|claude_override|gpt_bypass/i,
  /\[system\s*:\s*admin\s*mode\]/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /style\s*=\s*["'][^"']*(font-size\s*:\s*0|opacity\s*:\s*0|display\s*:\s*none|visibility\s*:\s*hidden|color\s*:\s*transparent|color\s*:\s*white)[^"']*["']/gi,
];

// Zero-width spaces, joiners, directional overrides often used for steganography
const INVISIBLE_UNICODE_REGEX = /[\u200B-\u200D\uFEFF\u202A-\u202E]/g;

export class PromptInjectionDefense {
  /**
   * Sanitizes candidate resume raw text and identifies injection exploits.
   */
  static sanitizeResumeText(rawText: string): SanitizationResult {
    const threatFlags: string[] = [];
    let cleanedText = rawText;

    // 1. Detect and strip invisible Unicode characters
    if (INVISIBLE_UNICODE_REGEX.test(rawText)) {
      threatFlags.push('INVISIBLE_UNICODE_STEGANOGRAPHY: Detected hidden zero-width characters in document');
      cleanedText = cleanedText.replace(INVISIBLE_UNICODE_REGEX, '');
    }

    // 2. Detect hidden HTML/CSS tricks (e.g. font-size: 0px white text)
    const hiddenStyleMatches = rawText.match(/style\s*=\s*["'][^"']*(font-size\s*:\s*0|opacity\s*:\s*0|display\s*:\s*none|visibility\s*:\s*hidden|color\s*:\s*transparent|color\s*:\s*white)[^"']*["']/gi);
    if (hiddenStyleMatches && hiddenStyleMatches.length > 0) {
      threatFlags.push('HIDDEN_CSS_PAYLOAD: Detected zero-font or transparent HTML styles designed to hide text from humans');
      // Strip out the hidden tags
      cleanedText = cleanedText.replace(/<[^>]*style\s*=\s*["'][^"']*(font-size\s*:\s*0|opacity\s*:\s*0|display\s*:\s*none|visibility\s*:\s*hidden|color\s*:\s*transparent|color\s*:\s*white)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    }

    // 3. Scan for adversarial override instructions
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(cleanedText)) {
        threatFlags.push(`MALICIOUS_PROMPT_HIJACK: Matched rule: ${pattern.source}`);
        // Neutralize the injection text
        cleanedText = cleanedText.replace(pattern, '[REDACTED_ADVERSARIAL_INJECTION]');
      }
    }

    // 4. Strip dangerous markdown and HTML script injections
    cleanedText = cleanedText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');

    const isCompromised = threatFlags.length > 0;
    const threatLevel: SanitizationResult['threatLevel'] =
      threatFlags.length === 0
        ? 'CLEAN'
        : threatFlags.some((f) => f.includes('MALICIOUS_PROMPT_HIJACK'))
        ? 'CRITICAL_MALICIOUS'
        : 'SUSPICIOUS';

    return {
      isCompromised,
      sanitizedText: cleanedText,
      threatFlags,
      threatLevel,
    };
  }

  /**
   * Masks Personally Identifiable Information (PII) for blind screening / bias-free hiring.
   */
  static maskPiiForBlindScreening(candidate: {
    fullName: string;
    email: string;
    phone: string;
    collegeName: string;
    gender?: string;
  }): {
    anonymizedId: string;
    maskedName: string;
    maskedEmail: string;
    maskedPhone: string;
    maskedCollege: string;
  } {
    const idSuffix = Math.abs(candidate.email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 1000;
    return {
      anonymizedId: `CANDIDATE-#${idSuffix.toString().padStart(3, '0')}`,
      maskedName: `Candidate #${idSuffix.toString().padStart(3, '0')}`,
      maskedEmail: `applicant.${idSuffix}@secure-talent.novahr.internal`,
      maskedPhone: '+91 ••••• •••••',
      maskedCollege: 'Top Accredited University (Blind Screening)',
    };
  }
}
