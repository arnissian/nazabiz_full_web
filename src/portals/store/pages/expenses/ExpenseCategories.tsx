import React, { useState } from 'react';
import { Tag, Plus, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExpenseCategories } from '../../hooks/expenses/useExpenseCategories';
import FormModal from '../../../shared/components/common/FormModal';
import { TableExportButton } from '../../../shared/components/common/TableToolbar';

export default function ExpenseCategories() {
  const navigate = useNavigate();
  const { categories, loading, createCategory } = useExpenseCategories();
  const exportRows = [
    ['Nom', 'Description', 'Couleur'],
    ...categories.map(category => [category.name, category.description || '', category.color || '']),
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');

    const res = await createCategory(name.trim(), description.trim(), color);
    if (res.success) {
      setName('');
      setDescription('');
      setIsModalOpen(false);
    } else {
      setError(res.message || 'Erreur');
    }
    setSubmitting(false);
  };

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-light btn-sm border"
            onClick={() => navigate('/pos/expenses')}
            title="Retour aux dépenses"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="fw-bold text-dark mb-0 fs-5">Catégories de Dépenses</h1>
            <div className="text-muted small">Classification des charges d'exploitation</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <TableExportButton rows={exportRows} />
          <button
            type="button"
            className="btn btn-sm btn-primary border-0 shadow-2xs d-flex align-items-center gap-1 px-3 py-1 rounded-2 fw-medium"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} /> Nouvelle Catégorie
          </button>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
        {categories.map((cat) => (
          <div key={cat.id} className="col">
            <div className="card border shadow-2xs rounded-3 p-3 h-100 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="p-2 rounded-2"
                    style={{ backgroundColor: `${cat.color || '#3b82f6'}20`, color: cat.color || '#3b82f6' }}
                  >
                    <Tag size={18} />
                  </span>
                  <h6 className="fw-bold text-dark mb-0">{cat.name}</h6>
                </div>
                <span
                  className="badge rounded-pill"
                  style={{ backgroundColor: `${cat.color || '#3b82f6'}20`, color: cat.color || '#3b82f6' }}
                >
                  Actif
                </span>
              </div>
              <p className="text-muted small mb-0">{cat.description || 'Aucune description'}</p>
            </div>
          </div>
        ))}
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle Catégorie de Dépense"
        icon={<Plus size={18} />}
        size="modal-md"
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Créer la catégorie"
        error={error}
      >
        <div className="mb-3">
          <fieldset className="custom-fieldset">
            <legend>Nom de la catégorie <span className="text-danger">*</span></legend>
            <input
              type="text"
              required
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Frais postaux, Salaires..."
            />
          </fieldset>
        </div>

        <div className="mb-3">
          <fieldset className="custom-fieldset">
            <legend>Couleur d'identification</legend>
            <input
              type="color"
              className="form-control form-control-color w-100"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </fieldset>
        </div>

        <div className="mb-3">
          <fieldset className="custom-fieldset">
            <legend>Description</legend>
            <textarea
              className="form-control"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description ou règles d'affectation..."
            />
          </fieldset>
        </div>
      </FormModal>
    </div>
  );
}
