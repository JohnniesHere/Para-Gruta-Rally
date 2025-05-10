import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FirestoreService } from './dataSync';
import Spinner from './common/Spinner';
import ErrorMessage from './common/ErrorMessage';

const CategoryAssignment = () => {
    const { kidId } = useParams();
    const navigate = useNavigate();
    const [kid, setKid] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Fetch kid and all available categories
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch kid data
                const kidDoc = await getDoc(doc(db, 'children', kidId));
                if (!kidDoc.exists()) {
                    throw new Error('Child not found');
                }
                const kidData = { id: kidDoc.id, ...kidDoc.data() };
                setKid(kidData);

                // Set initially selected categories
                if (kidData.categories) {
                    setSelectedCategories(kidData.categories.map(cat => cat.id));
                }

                // Fetch all categories
                const categoriesSnapshot = await getDocs(collection(db, 'categories'));
                const categoriesData = categoriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategories(categoriesData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [kidId]);

    // Toggle category selection
    const toggleCategory = (categoryId) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    // Save category assignments
    const handleSave = async () => {
        try {
            setSaving(true);

            // Convert selected category IDs to full category objects
            const selectedCategoryObjects = categories
                .filter(category => selectedCategories.includes(category.id))
                .map(category => ({
                    id: category.id,
                    name: category.name,
                    color: category.color
                }));

            // Update child document with selected categories
            await FirestoreService.saveDocument('children', {
                ...kid,
                categories: selectedCategoryObjects
            }, kidId);

            navigate(`/kid/${kidId}`);
        } catch (err) {
            console.error('Error saving categories:', err);
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error.message} />;
    if (!kid) return <ErrorMessage message="Child not found" />;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Assign Categories: {kid.firstName} {kid.lastName}
                </h1>
                <div className="space-x-2">
                    <button
                        onClick={() => navigate(`/kid/${kidId}`)}
                        className="bg-gray-200 px-4 py-2 rounded"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Categories'}
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-gray-600 mb-2">
                    Select the categories that apply to this child. These categories help with filtering and grouping.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                    <div
                        key={category.id}
                        className={`p-4 rounded-md cursor-pointer border-2 ${
                            selectedCategories.includes(category.id)
                                ? `border-${category.color || 'blue'}-500 bg-${category.color || 'blue'}-50`
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleCategory(category.id)}
                    >
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(category.id)}
                                onChange={() => toggleCategory(category.id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3">
                                <h3 className="text-lg font-medium">{category.name}</h3>
                                {category.description && (
                                    <p className="text-sm text-gray-500">{category.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No categories available. Create categories first.</p>
                    <button
                        onClick={() => navigate('/categories')}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Manage Categories
                    </button>
                </div>
            )}
        </div>
    );
};

export default CategoryAssignment;