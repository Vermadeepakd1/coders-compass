import { useState } from 'react';
import { updateProfile } from '../services/authApi';
import toast from 'react-hot-toast';

const EditProfileModal = ({ user, updateUser, onClose }) => {
    const [formData, setFormData] = useState({
        codeforces: user.handles?.codeforces || '',
        leetcode: user.handles?.leetcode || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Call API
            const updatedUser = await updateProfile(formData);

            // 2. Update Global Context & LocalStorage
            updateUser({ handles: updatedUser.handles });

            toast.success("Profile updated! Refreshing stats...");
            onClose(); // Close modal

            // Optional: Reload page to fetch new stats immediately
            window.location.reload();

        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }; return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-[#111f22] p-6 rounded-xl shadow-2xl border border-gray-800 w-96">
                <h2 className="text-xl font-bold mb-6 text-white">Edit Handles</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Codeforces Handle</label>
                        <input
                            type="text"
                            className="w-full bg-[#1f2937] border border-gray-700 text-white p-2 rounded focus:outline-none focus:border-[#4ecdc4] transition-colors"
                            value={formData.codeforces}
                            onChange={e => setFormData({ ...formData, codeforces: e.target.value })}
                            placeholder="Enter Codeforces handle"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">LeetCode Username</label>
                        <input
                            type="text"
                            className="w-full bg-[#1f2937] border border-gray-700 text-white p-2 rounded focus:outline-none focus:border-[#4ecdc4] transition-colors"
                            value={formData.leetcode}
                            onChange={e => setFormData({ ...formData, leetcode: e.target.value })}
                            placeholder="Enter LeetCode username"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#4ecdc4] text-[#0f172a] font-semibold rounded hover:bg-[#2dd4bf] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
