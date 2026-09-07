import React from 'react';
import { PencilIcon, Trash2Icon } from '../../../constants';

interface CategoryManagerProps {
    title: string;
    categories: string[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onAddOrUpdate: () => void;
    onEdit: (value: string) => void;
    onDelete: (value: string) => void;
    editingValue: string | null;
    onCancelEdit: () => void;
    placeholder: string;
    suggestedDefaults?: string[];
    onAddSuggested?: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
    title, categories, inputValue, onInputChange, onAddOrUpdate, onEdit, onDelete, 
    editingValue, onCancelEdit, placeholder, suggestedDefaults, onAddSuggested 
}) => {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onAddOrUpdate();
        }
    };

    const renderCategoryItem = (category: string) => (
        <div key={category} className="flex items-center justify-between p-2 md:p-2.5 bg-brand-bg rounded-md">
            <span className="text-xs md:text-sm text-brand-text-primary truncate flex-1 mr-2">{category}</span>
            <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                <button type="button" onClick={() => onEdit(category)} className="p-1 text-brand-text-secondary hover:text-brand-accent" title="Edit"><PencilIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                <button type="button" onClick={() => onDelete(category)} className="p-1 text-brand-text-secondary hover:text-brand-danger" title="Hapus"><Trash2Icon className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
            </div>
        </div>
    );

    return (
        <div>
            <h3 className="text-sm md:text-lg font-semibold text-brand-text-light border-b border-gray-700/50 pb-2 md:pb-3 mb-3 md:mb-4">{title}</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-3 md:mb-4">
                <div className="input-group flex-grow !mt-0">
                    <input
                        type="text"
                        id={`input-${title.replace(/\\s/g, '')}`}
                        value={inputValue}
                        onChange={e => onInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder=" "
                        className="input-field"
                    />
                    <label htmlFor={`input-${title.replace(/\\s/g, '')}`} className="input-label">{placeholder}</label>
                </div>
                <div className="flex gap-2">
                    <button onClick={onAddOrUpdate} className="button-primary h-fit mt-2 flex-1 sm:flex-none">{editingValue ? 'Update' : 'Tambah'}</button>
                    {editingValue && <button onClick={onCancelEdit} className="button-secondary h-fit mt-2 flex-1 sm:flex-none">Batal</button>}
                </div>
            </div>
            {suggestedDefaults?.length && onAddSuggested && (
                <div className="mb-3 md:mb-4">
                    <button type="button" onClick={onAddSuggested} className="text-xs md:text-sm text-brand-accent hover:underline">
                        + Tambah dari saran default
                    </button>
                </div>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {categories && categories.length > 0 ? categories.map(cat => renderCategoryItem(cat)) : (
                    <div className="text-center text-brand-text-secondary text-sm py-4">
                        Belum ada {title.toLowerCase()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManager;
