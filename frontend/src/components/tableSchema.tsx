"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { uiClasses } from "./uiClasses";

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
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      setCount(initialCount);
      setNames(initialNames);
      setTimeout(() => firstInputRef.current?.focus(), 0);
    }
  }, [open, initialCount, initialNames]);

  if (!open) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schema-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="schema-title" className="text-lg font-semibold text-slate-900">
              Define Attributes
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Set the number of attributes once. After saving, the schema is locked.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Number of attributes</span>
            <input
              ref={firstInputRef}
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(e) => {
                const next = Math.max(1, Number(e.target.value) || 1);
                setCount(next);
                ensureNamesLength(next);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
            />
          </label>

          <div className="space-y-3">
            {names.slice(0, count).map((name, index) => (
              <label key={index} className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">Attribute {index + 1}</span>
                <input
                  value={name}
                  onChange={(e) => {
                    const next = [...names];
                    next[index] = e.target.value;
                    setNames(next);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            >
              Save Schema
            </button>
          </div>
        </div>
      </div>
    </div>
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
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {attributes.map((attr) => (
        <label key={attr} className="space-y-1">
          <span className="block text-sm font-medium text-slate-700">{attr}</span>
          <input
            value={value[attr] ?? ""}
            onChange={(e) => onChange(attr, e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
            placeholder={`Enter ${attr.toLowerCase()}`}
          />
        </label>
      ))}
    </div>
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
    <div className="mt-4 flex flex-wrap gap-2">
      <button onClick={onCreate} className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500">
        Create
      </button>
      <button
        onClick={onTransfer}
        disabled={!canTransfer}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-indigo-500"
      >
        Transfer
      </button>
      <button
        onClick={onUpdate}
        disabled={!canUpdate}
        className="rounded-lg bg-amber-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-amber-500"
      >
        Update
      </button>
      <button
        onClick={onDelete}
        disabled={!canDelete}
        className="rounded-lg bg-rose-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-rose-500"
      >
        Delete
      </button>
      <button
        onClick={onCancel}
        className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>
    </div>
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">#</th>
            {attributes.map((attr) => (
              <th key={attr} className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                {attr}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={attributes.length + 2} className="px-4 py-8 text-center text-sm text-slate-500">
                No rows yet. Use the form above to create one.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className={index === activeRowIndex ? "bg-slate-100" : "hover:bg-slate-50"}>
                <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                {attributes.map((attr) => (
                  <td key={attr} className="px-4 py-3 text-sm text-slate-800">
                    {row[attr] || "-"}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelectRow(index)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
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
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className={uiClasses.sectionTitle}>Editable Table</h2>
        <button
          onClick={openSchema}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          {schema ? "Edit Schema" : "Set Attributes"}
        </button>
      </div>

      {!schema && (
        <div className={uiClasses.panelBody}>
          <h1 className={uiClasses.panelSubHeader}>
            No schema yet. Click Set Attributes to begin.
          </h1>
        </div>
      )}

      {schema && (
        <div className={"rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"}>
          <div className="border-b border-slate-200 p-4">
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
          </div>

          <DataTable
            attributes={attributes}
            rows={rows}
            activeRowIndex={activeRowIndex}
            onSelectRow={selectRow}
          />
        </div>
      )}

      <div className={uiClasses.panelHeader}>
        Current mode: <span className={uiClasses.panelSubHeader}>{mode}</span>
      </div>

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
    </div>
  );
}
