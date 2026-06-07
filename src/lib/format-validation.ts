import type { ZodError } from 'zod';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  password: 'Senha',
  passwordConfirm: 'Confirmação de senha',
  acceptTerms: 'Termos de uso',
  confirmPhrase: 'Confirmação',
  targetShortId: 'Código',
  friendShortId: 'Código do amigo',
};

export function formatZodValidationError(error: ZodError): string {
  const issues = error.issues;

  const refined = issues.find(
    (issue) => issue.code === 'custom' || issue.code === 'invalid_literal',
  );
  if (refined?.message) {
    return refined.message;
  }

  const passwordMismatch = issues.find((issue) =>
    issue.message.toLowerCase().includes('senhas'),
  );
  if (passwordMismatch) {
    return passwordMismatch.message;
  }

  if (issues.length === 1) {
    return formatSingleIssue(issues[0]);
  }

  return 'Verifique os dados informados e tente novamente.';
}

function formatSingleIssue(issue: ZodError['issues'][number]): string {
  const fieldKey = String(issue.path[0] ?? '');
  const label = FIELD_LABELS[fieldKey] ?? 'Campo';

  if (issue.code === 'too_small' && issue.type === 'string') {
    return `${label}: use pelo menos ${issue.minimum} caracteres.`;
  }

  if (issue.code === 'invalid_string' && issue.validation === 'email') {
    return 'Informe um e-mail válido.';
  }

  if (issue.message && !issue.message.includes(String(issue.path[0]))) {
    return issue.message;
  }

  return `${label}: valor inválido.`;
}
