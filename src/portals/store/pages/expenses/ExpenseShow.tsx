import React, { useContext } from 'react';
import axios from 'axios';
import {
  Printer, Edit, Trash2, Download, FileText, Store,
  Calendar, CreditCard, Receipt, DollarSign, Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../../shared/context/AppContext';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import { toast } from 'react-toastify';
import type { Expense } from '../../types/expense';
import { TenantDocumentHeader } from '../../../shared/components/common/TenantDocumentHeader';

interface ExpenseShowProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export default function ExpenseShow({ isOpen, onClose, expense }: ExpenseShowProps) {
  const navigate = useNavigate();
  const { formatFromUSD } = useStoreCurrencyConverter();
  const { activeStore } = useContext(AppContext);

  if (!isOpen || !expense) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ['Référence', 'Date', 'Catégorie', 'Magasin', 'Mode de paiement', 'Montant', 'Description'],
      [
        expense.reference || expense.id,
        new Date(expense.date).toLocaleDateString(),
        expense.category?.name || 'Charge',
        expense.store?.name || 'Magasin',
        expense.payment_method,
        expense.amount,
        expense.notes || ''
      ]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `depense_${expense.reference || expense.id}.csv`;
    link.click();
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
      try {
        await axiosInstance.delete(`/expenses/${expense.id}`);
        toast.success('Dépense supprimée avec succès');
        onClose();
      } catch (error: unknown) {
        const message = axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined;
        toast.error(message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = () => {
    onClose();
    navigate(`/pos/expenses/edit/${expense.id}`);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content shadow-lg rounded-3 overflow-hidden">
          
          {/* Header */}
          <div className="modal-header border-bottom bg-white py-3 px-4">
            <div className="d-flex align-items-center justify-content-between w-100">
              <h5 className="modal-title text-dark d-flex align-items-center gap-2 m-0 fs-6 fw-normal">
                <span className="bg-danger-subtle text-danger p-2 rounded d-flex align-items-center justify-content-center">
                  <DollarSign size={18} />
                </span>
                Détails de la Dépense
                <span className="badge bg-secondary ms-2">{expense.reference || expense.id}</span>
              </h5>
              
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                  onClick={handlePrint}
                  title="Imprimer"
                >
                  <Printer size={14} /> Imprimer
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={handleExport}
                  title="Exporter"
                >
                  <Download size={14} /> Exporter
                </button>
                <button
                  type="button"
                  className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
                  onClick={handleEdit}
                  title="Modifier"
                >
                  <Edit size={14} /> Modifier
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                  onClick={handleDelete}
                  title="Supprimer"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-close shadow-none ms-2"
                  aria-label="Fermer"
                ></button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body p-4  fw-normal">
            <TenantDocumentHeader />
            <div className="row g-4">
              
              {/* Informations principales (Colonne de gauche) */}
              <div className="col-lg-8">
                
                {/* Montant mis en avant */}
                <div className="bg-white p-4 rounded-3 shadow-2xs mb-4 border text-center  bg-opacity-10">
                  <span className="text-muted small d-block mb-1">Montant décaissé</span>
                  <h2 className="fw-bold text-danger mb-0">
                    -{formatFromUSD(Number(expense.amount))}
                  </h2>
                </div>

                {/* Détails de la dépense */}
                <div className="bg-white p-3 rounded-3 shadow-2xs mb-4 border">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <FileText size={16} className="text-primary" />
                    <h6 className="fw-bold mb-0 text-dark">Détails de la Dépense</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1">Date de la dépense</span>
                      <div className="d-flex align-items-center gap-1 text-dark">
                        <Calendar size={14} className="text-muted" />
                        <span>{new Date(expense.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1">Catégorie</span>
                      <div className="d-flex align-items-center gap-1">
                        <Tag size={14} className="text-muted" />
                        <span className="badge bg-primary-subtle text-primary fw-semibold px-2 py-1">
                          {expense.category?.name || 'Charge générale'}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1">Magasin</span>
                      <div className="d-flex align-items-center gap-1 text-dark">
                        <Store size={14} className="text-muted" />
                        <span>{expense.store?.name || activeStore?.name || 'Magasin'}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1">Mode de paiement</span>
                      <div className="d-flex align-items-center gap-1 text-dark text-capitalize">
                        <CreditCard size={14} className="text-muted" />
                        <span>{expense.payment_method}</span>
                      </div>
                    </div>
                    {expense.reference_no && (
                      <div className="col-md-6">
                        <span className="text-muted small d-block mb-1">Pièce justificative</span>
                        <div className="d-flex align-items-center gap-1 text-dark fw-semibold">
                          <Receipt size={14} className="text-muted" />
                          <span>{expense.reference_no}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {expense.notes && (
                  <div className="bg-white p-3 rounded-3 shadow-2xs border">
                    <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                      <FileText size={16} className="text-primary" />
                      <h6 className="fw-bold mb-0 text-dark">Motif / Description</h6>
                    </div>
                    <div className="p-3 bg-light rounded-3 text-dark">
                      <p className="mb-0">{expense.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Résumé (Colonne de droite) */}
              <div className="col-lg-4">
                <div className="bg-white p-3 rounded-3 shadow-2xs border sticky-top" style={{ top: '20px' }}>
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <DollarSign size={16} className="text-primary" />
                    <h6 className="fw-bold mb-0 text-dark">Résumé</h6>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Référence</span>
                    <span className="fw-semibold text-dark">{expense.reference || expense.id}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Catégorie</span>
                    <span className="fw-semibold text-dark">{expense.category?.name || 'N/A'}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-3 p-2 bg-light rounded-2 border">
                    <span className="fw-bold text-dark">Montant</span>
                    <span className="fw-bold text-danger fs-5">
                      -{formatFromUSD(Number(expense.amount))}
                    </span>
                  </div>

                  <div className="d-flex gap-2 pt-2 border-top">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                      onClick={handlePrint}
                    >
                      <Printer size={14} /> Imprimer
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                      onClick={handleExport}
                    >
                      <Download size={14} /> Exporter
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top bg-white py-2 px-4">
            <button
              type="button"
              className="btn btn-outline-dark btn-sm px-3"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}