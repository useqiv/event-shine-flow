import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/hooks/useForms';

export interface ConditionalRule {
  field_id: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value: string;
}

export interface ConditionalLogic {
  action: 'show' | 'hide';
  logic_type: 'all' | 'any';
  rules: ConditionalRule[];
}

interface ConditionalLogicEditorProps {
  value: ConditionalLogic | null;
  onChange: (value: ConditionalLogic | null) => void;
  availableFields: FormField[];
  currentFieldId: string;
}

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
];

const ConditionalLogicEditor = ({ 
  value, 
  onChange, 
  availableFields,
  currentFieldId 
}: ConditionalLogicEditorProps) => {
  // Filter out the current field and layout fields
  const selectableFields = availableFields.filter(
    f => f.id !== currentFieldId && !['heading', 'paragraph', 'divider', 'image'].includes(f.field_type)
  );

  const handleAddRule = () => {
    if (!value) {
      onChange({
        action: 'show',
        logic_type: 'all',
        rules: [{ field_id: selectableFields[0]?.id || '', operator: 'equals', value: '' }],
      });
    } else {
      onChange({
        ...value,
        rules: [...value.rules, { field_id: selectableFields[0]?.id || '', operator: 'equals', value: '' }],
      });
    }
  };

  const handleRemoveRule = (index: number) => {
    if (!value) return;
    const newRules = value.rules.filter((_, i) => i !== index);
    if (newRules.length === 0) {
      onChange(null);
    } else {
      onChange({ ...value, rules: newRules });
    }
  };

  const handleUpdateRule = (index: number, updates: Partial<ConditionalRule>) => {
    if (!value) return;
    const newRules = value.rules.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    );
    onChange({ ...value, rules: newRules });
  };

  const handleClear = () => {
    onChange(null);
  };

  if (selectableFields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Add more fields to enable conditional logic.
      </p>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Conditional Logic</CardTitle>
          {value && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs">
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {value && (
          <>
            <div className="flex items-center gap-2">
              <Select 
                value={value.action} 
                onValueChange={(action: 'show' | 'hide') => onChange({ ...value, action })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show">Show</SelectItem>
                  <SelectItem value="hide">Hide</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">this field when</span>
              <Select 
                value={value.logic_type} 
                onValueChange={(logic_type: 'all' | 'any') => onChange({ ...value, logic_type })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">conditions match</span>
            </div>

            <div className="space-y-3">
              {value.rules.map((rule, index) => {
                const needsValue = !['is_empty', 'is_not_empty'].includes(rule.operator);
                
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Select 
                      value={rule.field_id} 
                      onValueChange={(field_id) => handleUpdateRule(index, { field_id })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableFields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={rule.operator} 
                      onValueChange={(operator: ConditionalRule['operator']) => handleUpdateRule(index, { operator })}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {needsValue && (
                      <Input
                        value={rule.value}
                        onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1"
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRule}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          {value ? 'Add Condition' : 'Add Conditional Logic'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConditionalLogicEditor;
