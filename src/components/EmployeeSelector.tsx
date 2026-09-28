import React, { useState } from 'react';
import { User, Check, Plus, ChevronDown, ShieldCheck } from 'lucide-react';
import { Employee } from '../types/inventory';
import { db } from '../services/storage';

interface EmployeeSelectorProps {
  currentEmployee: Employee;
  onEmployeeChange: (emp: Employee) => void;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  currentEmployee,
  onEmployeeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(db.getEmployees());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Staff Operasional');

  const handleSelect = (emp: Employee) => {
    db.setActiveEmployee(emp);
    onEmployeeChange(emp);
    setIsOpen(false);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const added = db.addEmployee(newName.trim(), newRole.trim());
    setEmployees(db.getEmployees());
    db.setActiveEmployee(added);
    onEmployeeChange(added);
    setNewName('');
    setShowAddForm(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs"
        aria-label="Active Employee"
      >
        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
          <User className="w-3 h-3" />
        </div>
        <div className="text-left">
          <span className="truncate max-w-[100px] sm:max-w-[140px] block leading-tight">
            {currentEmployee.name}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-neutral-200 p-2.5 z-40 animate-in fade-in slide-in-from-top-2">
          <div className="px-2 py-1.5 border-b border-neutral-100 flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Active Operator
            </span>
            <span className="text-[10px] text-neutral-400">Audit Trail</span>
          </div>

          <div className="space-y-1 max-h-52 overflow-y-auto">
            {employees.map((emp) => {
              const isSelected = emp.id === currentEmployee.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => handleSelect(emp)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/70'
                      : 'hover:bg-neutral-50 text-neutral-700 font-medium'
                  }`}
                >
                  <div>
                    <p className="leading-tight">{emp.name}</p>
                    <p className="text-[10px] text-neutral-400 font-normal">{emp.role}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {showAddForm ? (
            <form onSubmit={handleAddEmployee} className="mt-2 pt-2 border-t border-neutral-100 space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Employee full name"
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-amber-500 font-medium"
                autoFocus
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="Staff Operasional">Staff Operasional</option>
                <option value="Staff Display / Kasir">Staff Display / Kasir</option>
                <option value="Kepala Gudang">Kepala Gudang</option>
                <option value="Karyawan Baru">Karyawan Baru</option>
              </select>
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Save Employee
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2.5 py-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 w-full pt-2 border-t border-neutral-100 text-amber-600 hover:text-amber-700 text-xs font-semibold py-1 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Employee
            </button>
          )}
        </div>
      )}
    </div>
  );
};
