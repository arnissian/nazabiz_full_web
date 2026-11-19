import React, { useState, useMemo } from 'react';
import { Loader } from '../../../shared/components/common/Loader';
import {
  DollarSign, Plus, Eye, Edit, Trash2, Tag,
  AlertTriangle, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TableToolbar } from '../../../shared/components/common/TableToolbar';
import { Pagination } from '../../../shared/components/common/Pagination';
import { useExpenses } from '../../hooks/expenses/useExpenses';
import { useDeleteExpense } from '../../hooks/expenses/useDeleteExpense';
import { useExpenseCategories } from '../../hooks/expenses/useExpenseCategories';
import ExpenseCreate from './ExpenseCreate';
import ExpenseEdit from './ExpenseEdit';
import ExpenseShow from './ExpenseShow';
import type { Expense } from '../../types/expense';

export default function Expenses() {
  const navigate = useNavigate();
  const { expenses, pagination, loading, error, params, setParams, reFetch } =
    useExpenses({ page: 1, per_page: 5 });
  const { deleteExpense } = useDeleteExpense();
  const { categories } = useExpenseCategories();

  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<Expense | null>(null);
  const [show, setShow] = useState<Expense | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
      const res = await deleteExpense(id);
      if (res.success) {
        reFetch();
      } else {
        alert(res.message);
      }
    }
  };

  // KPIs
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  // Style partagé similaire aux cartes d'opérations rapides
  const kpiCards = [
    {
      title: "Total dépenses enregistrées",
      value: `${totalAmount.toLocaleString()} $`,
      icon: DollarSign,
      color: "#ef4770",
      background: "#fff0f4"
    },
    {
      title: "Nombre d'opérations",
      value: `${expenses.length} dépenses`,
      icon: CreditCard,
      color: "#4188e9",
      background: "#eef5ff"
    },
    {
      title: "Catégories disponibles",
      value: `${categories.length} catégories`,
      icon: Tag,
      color: "#32b978",
      background: "#eaf9f1"
    }
  ];

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <h1 className="fw-bold text-dark mb-0 fs-5">Dépenses & Charges</h1>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={() => navigate('/pos/expenses/categories')}
          >
            <Tag size={14} /> Gérer les Catégories
          </button>
          <TableToolbar
            searchValue={params.search || ''}
            onSearchChange={(q) => setParams((p: any) => ({ ...p, search: q || undefined, page: 1 }))}
            searchPlaceholder="Rechercher dépense ou motif..."
            perPage={params.per_page || 5}
            onPerPageChange={(n) => setParams((p: any) => ({ ...p, per_page: n, page: 1 }))}
            onAddClick={() => setCreate(true)}
            addButtonLabel="Nouvelle Dépense"
          />
        </div>
      </div>

      {/* KPI Cards (Inspirées des opérations rapides) */}
      <div className="row g-3 mb-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="col-md-4">
              <div 
                className="card shadow-2xs rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3"
                style={{ transition: 'transform 0.2s ease' }}
              >
                <div 
                  className="d-flex align-items-center justify-content-center rounded-3" 
                  style={{ width: '48px', height: '48px', background: card.background, color: card.color, flexShrink: 0 }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span className="text-muted d-block text-truncate" style={{ fontSize: '12px' }}>{card.title}</span>
                  <h4 className="fw-bold text-dark mb-0 fs-5">{card.value}</h4>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card border border-light shadow-2xs rounded-3 overflow-hidden bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="border-bottom border-light-subtle bg-light-subtle">
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Réf. Dépense
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Date
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Catégorie
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Magasin
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Mode
                  </th>
                  <th className="py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>
                    Montant
                  </th>
                  <th className="py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      <Loader height="100px" />
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <DollarSign size={32} className="mb-2 opacity-30" />
                      <div>Aucune dépense enregistrée.</div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="border-bottom border-light">
                      <td className="py-3 text-start">
                        <span className="fw-semibold text-primary">{e.reference || e.id}</span>
                        {e.reference_no && (
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            Doc: {e.reference_no}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-start text-muted" style={{ fontSize: '12px' }}>
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-start">
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: `${e.category?.color || '#3b82f6'}20`,
                            color: e.category?.color || '#3b82f6',
                            fontSize: '11px'
                          }}
                        >
                          {e.category?.name || 'Charge'}
                        </span>
                      </td>
                      <td className="py-3 text-start text-dark fw-medium" style={{ fontSize: '12px' }}>
                        {e.store?.name || 'Magasin'}
                      </td>
                      <td className="py-3 text-start text-muted text-capitalize" style={{ fontSize: '12px' }}>
                        {e.payment_method}
                      </td>
                      <td className="py-3 text-end fw-bold text-danger">
                        -{Number(e.amount).toLocaleString()} $
                      </td>
                      <td className="py-3 text-end">
                        <div className="d-flex justify-content-end align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-secondary"
                            title="Voir le détail"
                            onClick={() => setShow(e)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-primary"
                            title="Modifier"
                            onClick={() => setEdit(e)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-danger"
                            title="Supprimer"
                            onClick={() => handleDelete(e.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {pagination && (
        <div className="mt-3">
          <Pagination
            currentPage={pagination.current_page || 1}
            lastPage={pagination.last_page || 1}
            total={pagination.total || expenses.length}
            onPageChange={(page) => setParams((p: any) => ({ ...p, page }))}
          />
        </div>
      )}

      {/* Modals */}
      <ExpenseCreate
        isOpen={create}
        onClose={() => setCreate(false)}
        onSuccess={() => reFetch()}
      />

      <ExpenseEdit
        isOpen={!!edit}
        onClose={() => setEdit(null)}
        expense={edit}
        onSuccess={() => reFetch()}
      />

      <ExpenseShow
        isOpen={!!show}
        onClose={() => setShow(null)}
        expense={show}
      />
    </div>
  );
}