"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

type RowData = Record<string, string>;

type TableSchema = {
  attributes: string[];
};

type ActionMode = "create" | "update" | "transfer" | "delete";

const makeEmptyRow = (attributes: string[]): RowData =>
  attributes.reduce<RowData>((acc, attr) => {
    acc[attr] = "";
    return acc;
  }, {});

function SchemaModal({
  open,
  initialCount,
  initialNames,
  onClose,
  onSave,
}: {
  open: boolean;
  initialCount: number;
  initialNames: string[];
  onClose: () => void;
  onSave: (schema: TableSchema) => void;
}) {
  const [count, setCount] = useState(initialCount);
  const [names, setNames] = useState<string[]>(initialNames);

  useEffect(() => {
    if (open) {
      setCount(initialCount);
      setNames(initialNames);
    }
  }, [open, initialCount, initialNames]);

  const ensureNamesLength = (nextCount: number) => {
    setNames((prev) => {
      const next = [...prev];
      while (next.length < nextCount) next.push(`Attribute ${next.length + 1}`);
      return next.slice(0, nextCount);
    });
  };

  const save = () => {
    const cleaned = names.slice(0, count).map((n, i) => n.trim() || `Attribute ${i + 1}`);
    onSave({ attributes: cleaned });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Define Attributes</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set the number of attributes once. After saving, the schema is locked.
        </Typography>

        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            type="number"
            label="Number of attributes"
            slotProps={{ htmlInput: { min: 1, max: 12 } }}
            value={count}
            onChange={(e) => {
              const next = Math.max(1, Number(e.target.value) || 1);
              setCount(next);
              ensureNamesLength(next);
            }}
            fullWidth
          />

          {names.slice(0, count).map((name, index) => (
            <TextField
              key={index}
              label={`Attribute ${index + 1}`}
              value={name}
              onChange={(e) => {
                const next = [...names];
                next[index] = e.target.value;
                setNames(next);
              }}
              fullWidth
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>
          Save Schema
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RowForm({
  attributes,
  value,
  onChange,
}: {
  attributes: string[];
  value: RowData;
  onChange: (key: string, nextValue: string) => void;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {attributes.map((attr) => (
        <TextField
          key={attr}
          label={attr}
            value={value[attr] ?? ""}
            onChange={(e) => onChange(attr, e.target.value)}
            placeholder={`Enter ${attr.toLowerCase()}`}
          fullWidth
          />
      ))}
    </Box>
  );
}

function ActionBar({
  onCreate,
  onTransfer,
  onUpdate,
  onDelete,
  onCancel,
  canTransfer,
  canUpdate,
  canDelete,
}: {
  onCreate: () => void;
  onTransfer: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onCancel: () => void;
  canTransfer: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: "wrap" }}>
      <Button onClick={onCreate} variant="contained" color="success">
        Create
      </Button>
      <Button
        onClick={onTransfer}
        disabled={!canTransfer}
        variant="contained"
        color="info"
      >
        Transfer
      </Button>
      <Button
        onClick={onUpdate}
        disabled={!canUpdate}
        variant="contained"
        color="warning"
      >
        Update
      </Button>
      <Button
        onClick={onDelete}
        disabled={!canDelete}
        variant="contained"
        color="error"
      >
        Delete
      </Button>
      <Button onClick={onCancel} variant="outlined" color="inherit">
        Cancel
      </Button>
    </Stack>
  );
}

function DataTable({
  attributes,
  rows,
  activeRowIndex,
  onSelectRow,
}: {
  attributes: string[];
  rows: RowData[];
  activeRowIndex: number | null;
  onSelectRow: (index: number) => void;
}) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            {attributes.map((attr) => (
              <TableCell key={attr}>
                {attr}
              </TableCell>
            ))}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={attributes.length + 2} align="center" sx={{ py: 5, color: "text.secondary" }}>
                No rows yet. Use the form above to create one.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index} hover selected={index === activeRowIndex}>
                <TableCell sx={{ color: "text.secondary" }}>{index + 1}</TableCell>
                {attributes.map((attr) => (
                  <TableCell key={attr}>
                    {row[attr] || "-"}
                  </TableCell>
                ))}
                <TableCell>
                  <Button onClick={() => onSelectRow(index)} variant="outlined" size="small">
                    Select
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function EditableSchemaTable() {
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [attributeCount, setAttributeCount] = useState(3);
  const [attributeNames, setAttributeNames] = useState<string[]>(
    Array.from({ length: 3 }, (_, i) => `Attribute ${i + 1}`)
  );
  const [rows, setRows] = useState<RowData[]>([]);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [form, setForm] = useState<RowData>({});
  const [mode, setMode] = useState<ActionMode>("create");

  const attributes = useMemo(() => schema?.attributes ?? [], [schema]);

  useEffect(() => {
    if (schema) {
      setForm(makeEmptyRow(schema.attributes));
    }
  }, [schema]);

  const openSchema = () => setSchemaOpen(true);

  const saveSchema = (nextSchema: TableSchema) => {
    setSchema(nextSchema);
    setRows([]);
    setActiveRowIndex(null);
    setForm(makeEmptyRow(nextSchema.attributes));
    setSchemaOpen(false);
  };

  const handleCreate = () => {
    if (!schema) return;
    setRows((prev) => [...prev, { ...form }]);
    setForm(makeEmptyRow(schema.attributes));
    setActiveRowIndex(null);
    setMode("create");
  };

  const handleUpdate = () => {
    if (!schema || activeRowIndex === null) return;
    setRows((prev) => prev.map((row, index) => (index === activeRowIndex ? { ...form } : row)));
    setForm(makeEmptyRow(schema.attributes));
    setActiveRowIndex(null);
    setMode("create");
  };

  const handleDelete = () => {
    if (activeRowIndex === null) return;
    setRows((prev) => prev.filter((_, index) => index !== activeRowIndex));
    setActiveRowIndex(null);
    setForm(schema ? makeEmptyRow(schema.attributes) : {});
    setMode("create");
  };

  const handleTransfer = () => {
    if (activeRowIndex === null || rows.length < 2) return;
    const nextIndex = activeRowIndex + 1;
    if (nextIndex >= rows.length) return;

    setRows((prev) => {
      const copy = [...prev];
      [copy[activeRowIndex], copy[nextIndex]] = [copy[nextIndex], copy[activeRowIndex]];
      return copy;
    });

    setActiveRowIndex(nextIndex);
    setMode("transfer");
  };

  const selectRow = (index: number) => {
    setActiveRowIndex(index);
    setForm({ ...rows[index] });
    setMode("update");
  };

  return (
    <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 3, alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Editable Table
        </Typography>
        <Button onClick={openSchema} variant="contained">
          {schema ? "Edit Schema" : "Set Attributes"}
        </Button>
      </Stack>

      {!schema && (
        <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No schema yet. Click Set Attributes to begin.
          </Typography>
        </Paper>
      )}

      {schema && (
        <Paper variant="outlined" sx={{ overflow: "hidden", mb: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", p: 2 }}>
            <RowForm attributes={attributes} value={form} onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))} />
            <ActionBar
              onCreate={handleCreate}
              onTransfer={handleTransfer}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onCancel={() => {
                setActiveRowIndex(null);
                setForm(makeEmptyRow(attributes));
                setMode("create");
              }}
              canTransfer={activeRowIndex !== null && rows.length >= 2}
              canUpdate={activeRowIndex !== null}
              canDelete={activeRowIndex !== null}
            />
          </Box>

          <DataTable
            attributes={attributes}
            rows={rows}
            activeRowIndex={activeRowIndex}
            onSelectRow={selectRow}
          />
        </Paper>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current mode: <Box component="span" sx={{ fontWeight: 700, textTransform: "capitalize" }}>{mode}</Box>
      </Typography>

      <SchemaModal
        open={schemaOpen}
        initialCount={attributeCount}
        initialNames={attributeNames}
        onClose={() => setSchemaOpen(false)}
        onSave={(nextSchema) => {
          setAttributeCount(nextSchema.attributes.length);
          setAttributeNames(nextSchema.attributes);
          saveSchema(nextSchema);
        }}
      />
    </Box>
  );
}
