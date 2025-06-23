// src/components/modals/InstructorCommentModal.jsx
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { usePermissions } from '../../hooks/usePermissions';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    IconX as X,
    IconDeviceFloppy as Save,
    IconMessageCircle as MessageCircle,
    IconUser as User,
    IconTrash as Trash
} from '@tabler/icons-react';
import './InstructorCommentModal.css';

const InstructorCommentModal = ({ kid, isOpen, onClose, onSuccess }) => {
    const { userData, user } = usePermissions();
    const { t } = useLanguage();

    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comment.trim()) {
            setError(t('instructor.commentRequired', 'Comment is required'));
            return;
        }

        setSaving(true);
        setError('');

        try {
            const instructorName = userData?.displayName || userData?.name || user?.displayName || 'Instructor';

            const commentData = {
                id: `${user?.uid}_${Date.now()}`, // Add unique ID for deletion
                comment: comment.trim(),
                instructorId: user?.uid,
                instructorName: instructorName,
                timestamp: Timestamp.now()
            };

            // Add comment to the instructorsComments array
            await updateDoc(doc(db, 'kids', kid.id), {
                instructorsComments: arrayUnion(commentData)
            });

            // Call success callback
            if (onSuccess) {
                onSuccess(t('instructor.commentAdded', 'Comment added successfully!'));
            }

            // Reset form and close
            setComment('');
            onClose();

        } catch (error) {
            console.error('Error adding comment:', error);
            setError(t('instructor.commentError', 'Failed to add comment. Please try again.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteComment = async (commentToDelete) => {
        // Only allow deletion of own comments
        if (commentToDelete.instructorId !== user?.uid) {
            setError(t('instructor.canOnlyDeleteOwnComments', 'You can only delete your own comments'));
            return;
        }

        if (!window.confirm(t('instructor.confirmDeleteComment', 'Are you sure you want to delete this comment?'))) {
            return;
        }

        setDeleting(commentToDelete.id || `${commentToDelete.instructorId}_${commentToDelete.timestamp?.seconds}`);
        setError('');

        try {
            // Remove comment from the instructorsComments array
            await updateDoc(doc(db, 'kids', kid.id), {
                instructorsComments: arrayRemove(commentToDelete)
            });

            // Call success callback to refresh data
            if (onSuccess) {
                onSuccess(t('instructor.commentDeleted', 'Comment deleted successfully!'));
            }

        } catch (error) {
            console.error('Error deleting comment:', error);
            setError(t('instructor.deleteCommentError', 'Failed to delete comment. Please try again.'));
        } finally {
            setDeleting('');
        }
    };

    const handleClose = () => {
        setComment('');
        setError('');
        onClose();
    };

    if (!isOpen || !kid) return null;

    const kidName = `${kid.personalInfo?.firstName || ''} ${kid.personalInfo?.lastName || ''}`.trim() || 'Unknown';

    // Sort comments by timestamp (most recent first)
    const sortedComments = [...(kid.instructorsComments || [])].sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA; // Descending order (newest first)
    });

    return (
        <div className="instructor-comment-modal-overlay" onClick={handleClose}>
            <div className="instructor-comment-modal large" onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <div className="header-content">
                        <MessageCircle size={24} className="header-icon" />
                        <div>
                            <h2>{t('instructor.manageComments', 'Manage Instructor Comments')}</h2>
                            <p className="kid-name">
                                <User size={16} />
                                {kidName} (#{kid.participantNumber})
                            </p>
                        </div>
                    </div>
                    <button className="close-button" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </header>

                <main className="modal-body">
                    {error && (
                        <div className="error-alert">
                            {error}
                        </div>
                    )}

                    {/* Existing Comments Section */}
                    {sortedComments.length > 0 && (
                        <div className="existing-comments-section">
                            <h3>{t('instructor.existingComments', 'Existing Comments')} ({sortedComments.length})</h3>
                            <div className="comments-list">
                                {sortedComments.map((comment, index) => {
                                    const isOwnComment = comment.instructorId === user?.uid;
                                    const commentId = comment.id || `${comment.instructorId}_${comment.timestamp?.seconds}`;
                                    const isDeleting = deleting === commentId;

                                    return (
                                        <div key={commentId} className={`comment-item ${isOwnComment ? 'own-comment' : ''}`}>
                                            <div className="comment-header">
                                                <div className="comment-meta">
                                                    <span className="instructor-name">
                                                        {comment.instructorName || 'Instructor'}
                                                        {isOwnComment && <span className="you-indicator">({t('instructor.you', 'You')})</span>}
                                                    </span>
                                                    <span className="comment-date">
                                                        {comment.timestamp?.toDate ?
                                                            comment.timestamp.toDate().toLocaleDateString() :
                                                            'Unknown date'
                                                        }
                                                    </span>
                                                </div>
                                                {isOwnComment && (
                                                    <button
                                                        className="delete-comment-btn"
                                                        onClick={() => handleDeleteComment(comment)}
                                                        disabled={isDeleting}
                                                        title={t('instructor.deleteComment', 'Delete Comment')}
                                                    >
                                                        {isDeleting ? (
                                                            <div className="loading-spinner-mini" />
                                                        ) : (
                                                            <Trash size={14} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="comment-content">
                                                {comment.comment}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add New Comment Section */}
                    <div className="add-comment-section">
                        <h3>{t('instructor.addNewComment', 'Add New Comment')}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">
                                    {t('instructor.yourComment', 'Your Comment')} *
                                </label>
                                <textarea
                                    className="form-textarea"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t('instructor.commentPlaceholder', 'Add your observations, notes, or feedback about this participant...')}
                                    rows={4}
                                    maxLength={1000}
                                    required
                                />
                                <div className="character-count">
                                    {comment.length}/1000
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleClose}
                                    disabled={saving}
                                >
                                    {t('general.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving || !comment.trim()}
                                >
                                    {saving ? (
                                        <>
                                            <div className="loading-spinner-mini" />
                                            {t('instructor.addingComment', 'Adding...')}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {t('instructor.addComment', 'Add Comment')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default InstructorCommentModal;