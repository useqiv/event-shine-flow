import type { Form, FormField, FormResponse } from '@/hooks/useForms';

export type FormType = 'standard' | 'poll';
export type FormApprovalStatus = 'pending' | 'approved' | 'rejected';

export const isPollForm = (form: Pick<Form, 'form_type'> | null | undefined): boolean =>
  form?.form_type === 'poll';

export const POLL_TEMPLATE_NAME = 'Poll / Quick Vote';

export const isChoiceField = (fieldType: string): boolean =>
  ['radio', 'dropdown', 'checkbox', 'yes_no'].includes(fieldType);

export interface ChoiceAggregate {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  totalResponses: number;
  options: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
}

export const aggregateChoiceResponses = (
  fields: FormField[],
  responses: FormResponse[],
): ChoiceAggregate[] => {
  const choiceFields = fields.filter((field) => isChoiceField(field.field_type));

  return choiceFields.map((field) => {
    const optionLabels =
      field.field_type === 'yes_no'
        ? ['Yes', 'No']
        : (field.options ?? []);

    const counts = new Map<string, number>();
    optionLabels.forEach((option) => counts.set(option, 0));

    let totalResponses = 0;

    responses.forEach((response) => {
      const value = (response.response_data as Record<string, unknown>)[field.id];
      if (value === undefined || value === null || value === '') return;

      totalResponses += 1;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          const key = String(item);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        });
        return;
      }

      const key = String(value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const options = optionLabels.map((label) => {
      const count = counts.get(label) ?? 0;
      return {
        label,
        count,
        percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
      };
    });

    // Include write-in / unexpected answers that aren't in predefined options
    counts.forEach((count, label) => {
      if (!optionLabels.includes(label)) {
        options.push({
          label,
          count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        });
      }
    });

    return {
      fieldId: field.id,
      fieldLabel: field.label,
      fieldType: field.field_type,
      totalResponses,
      options: options.sort((a, b) => b.count - a.count),
    };
  });
};
