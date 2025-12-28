import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, Pencil, Trash2, Zap, AlertTriangle, Ban } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FraudRule {
  id: string;
  rule_name: string;
  rule_type: string;
  description: string | null;
  threshold_value: number;
  threshold_unit: string | null;
  severity: string;
  is_active: boolean;
  auto_flag: boolean;
  auto_block: boolean;
  created_at: string;
  updated_at: string;
}

const ruleTypes = [
  { value: "rapid_votes", label: "Rapid Voting" },
  { value: "bulk_votes", label: "Bulk Votes" },
  { value: "suspicious_pattern", label: "Suspicious Pattern" },
  { value: "ip_duplicate", label: "Duplicate IP" },
  { value: "time_based", label: "Time-Based" }
];

const severityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

export function FraudRulesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FraudRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: "",
    rule_type: "rapid_votes",
    description: "",
    threshold_value: 5,
    threshold_unit: "votes",
    severity: "medium",
    is_active: true,
    auto_flag: false,
    auto_block: false
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["fraud-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fraud_rules")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FraudRule[];
    }
  });

  const createRule = useMutation({
    mutationFn: async (data: Omit<FraudRule, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("fraud_rules").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-rules"] });
      toast.success("Fraud rule created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create rule: " + error.message);
    }
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FraudRule> & { id: string }) => {
      const { error } = await supabase.from("fraud_rules").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-rules"] });
      toast.success("Fraud rule updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update rule: " + error.message);
    }
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fraud_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-rules"] });
      toast.success("Fraud rule deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete rule: " + error.message);
    }
  });

  const toggleRuleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("fraud_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-rules"] });
    }
  });

  const resetForm = () => {
    setFormData({
      rule_name: "",
      rule_type: "rapid_votes",
      description: "",
      threshold_value: 5,
      threshold_unit: "votes",
      severity: "medium",
      is_active: true,
      auto_flag: false,
      auto_block: false
    });
    setEditingRule(null);
  };

  const handleEdit = (rule: FraudRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      description: rule.description || "",
      threshold_value: rule.threshold_value,
      threshold_unit: rule.threshold_unit || "votes",
      severity: rule.severity,
      is_active: rule.is_active,
      auto_flag: rule.auto_flag,
      auto_block: rule.auto_block
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...formData });
    } else {
      createRule.mutate(formData);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "high": return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
      case "medium": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>;
      case "low": return <Badge variant="secondary">Low</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case "rapid_votes": return <Zap className="h-4 w-4" />;
      case "bulk_votes": return <AlertTriangle className="h-4 w-4" />;
      case "ip_duplicate": return <Ban className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Fraud Detection Rules
          </CardTitle>
          <CardDescription>Configure automated fraud detection thresholds</CardDescription>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Auto Actions</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading rules...
                </TableCell>
              </TableRow>
            ) : rules?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No fraud rules configured
                </TableCell>
              </TableRow>
            ) : (
              rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rule.rule_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{rule.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRuleTypeIcon(rule.rule_type)}
                      <span className="text-sm">{ruleTypes.find(t => t.value === rule.rule_type)?.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{rule.threshold_value} {rule.threshold_unit}</span>
                  </TableCell>
                  <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {rule.auto_flag && <Badge variant="outline" className="text-xs">Flag</Badge>}
                      {rule.auto_block && <Badge variant="destructive" className="text-xs">Block</Badge>}
                      {!rule.auto_flag && !rule.auto_block && <span className="text-muted-foreground text-xs">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleRuleStatus.mutate({ id: rule.id, is_active: checked })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(rule.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Rule" : "Create Fraud Rule"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rule_name">Rule Name</Label>
                <Input
                  id="rule_name"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="e.g., Rapid Voting Detection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule_type">Rule Type</Label>
                <Select value={formData.rule_type} onValueChange={(v) => setFormData({ ...formData, rule_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ruleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this rule detects..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold_value">Threshold Value</Label>
                  <Input
                    id="threshold_value"
                    type="number"
                    value={formData.threshold_value}
                    onChange={(e) => setFormData({ ...formData, threshold_value: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold_unit">Unit</Label>
                  <Input
                    id="threshold_unit"
                    value={formData.threshold_unit}
                    onChange={(e) => setFormData({ ...formData, threshold_unit: e.target.value })}
                    placeholder="votes, minutes, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_flag">Auto-flag transactions</Label>
                  <Switch
                    id="auto_flag"
                    checked={formData.auto_flag}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_flag: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_block">Auto-block transactions</Label>
                  <Switch
                    id="auto_block"
                    checked={formData.auto_block}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_block: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Rule Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.rule_name}>
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
