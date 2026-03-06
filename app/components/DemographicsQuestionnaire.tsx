'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

interface DemographicsQuestionnaireProps {
    onComplete: () => void;
    onSkip: () => void;
}

const DEMOGRAPHICS_OPTIONS = {
    gender: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'non_binary', label: 'Non-binary' },
        { value: 'other', label: 'Other' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ],
    age_range: [
        { value: 'under_18', label: 'Under 18' },
        { value: '18_24', label: '18-24' },
        { value: '25_34', label: '25-34' },
        { value: '35_44', label: '35-44' },
        { value: '45_54', label: '45-54' },
        { value: '55_64', label: '55-64' },
        { value: '65_plus', label: '65+' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ],
    occupation: [
        { value: 'student', label: 'Student' },
        { value: 'employed_full_time', label: 'Employed (Full-time)' },
        { value: 'employed_part_time', label: 'Employed (Part-time)' },
        { value: 'self_employed', label: 'Self-employed' },
        { value: 'freelancer', label: 'Freelancer/Contractor' },
        { value: 'homemaker', label: 'Homemaker' },
        { value: 'retired', label: 'Retired' },
        { value: 'unemployed', label: 'Unemployed' },
        { value: 'other', label: 'Other' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ],
    race_ethnicity: [
        { value: 'american_indian_alaska_native', label: 'American Indian or Alaska Native' },
        { value: 'asian', label: 'Asian' },
        { value: 'black_african_american', label: 'Black or African American' },
        { value: 'hispanic_latino', label: 'Hispanic or Latino' },
        { value: 'middle_eastern_north_african', label: 'Middle Eastern or North African' },
        { value: 'native_hawaiian_pacific_islander', label: 'Native Hawaiian or Pacific Islander' },
        { value: 'white', label: 'White' },
        { value: 'multiracial', label: 'Multiracial' },
        { value: 'other', label: 'Other' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ],
    marital_status: [
        { value: 'single', label: 'Single' },
        { value: 'married', label: 'Married' },
        { value: 'domestic_partnership', label: 'Domestic Partnership' },
        { value: 'divorced', label: 'Divorced' },
        { value: 'separated', label: 'Separated' },
        { value: 'widowed', label: 'Widowed' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ]
};

export default function DemographicsQuestionnaire({ onComplete, onSkip }: DemographicsQuestionnaireProps) {
    const [formData, setFormData] = useState({
        gender: '',
        age_range: '',
        occupation: '',
        race_ethnicity: '',
        marital_status: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showToast.error('Not authenticated');
            setSubmitting(false);
            return;
        }

        // Only update fields that have values
        const updateData: any = {};
        Object.entries(formData).forEach(([key, value]) => {
            if (value) updateData[key] = value;
        });

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (error) {
            console.error('Demographics update error:', error);
            showToast.error('Failed to save information');
            setSubmitting(false);
        } else {
            showToast.success('Thank you for sharing!');
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-3xl px-8 py-6">
                    <h2 className="text-3xl font-bold mb-2">Help Us Understand Our Community</h2>
                    <p className="text-white/90 text-lg">
                        We appreciate you considering providing the following information, which will only be used for the purpose of aggregate reporting.
                        We do not share or sell personal information to third parties.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-6">
                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                Gender <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {DEMOGRAPHICS_OPTIONS.gender.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: option.value })}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${formData.gender === option.value
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Age Range */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                Age Range <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {DEMOGRAPHICS_OPTIONS.age_range.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, age_range: option.value })}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${formData.age_range === option.value
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Occupation */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                Occupation <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {DEMOGRAPHICS_OPTIONS.occupation.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, occupation: option.value })}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${formData.occupation === option.value
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Race/Ethnicity */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                Race/Ethnicity <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {DEMOGRAPHICS_OPTIONS.race_ethnicity.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, race_ethnicity: option.value })}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium text-left ${formData.race_ethnicity === option.value
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Marital Status */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                Marital Status <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {DEMOGRAPHICS_OPTIONS.marital_status.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, marital_status: option.value })}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${formData.marital_status === option.value
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-900">
                                <p className="font-semibold mb-1">Your Privacy Matters</p>
                                <p>All demographic information is completely optional and will only be used for aggregate statistical reporting. Individual responses are never shared or sold.</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mt-8">
                        <button
                            type="button"
                            onClick={onSkip}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            Skip for Now
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all shadow-lg"
                        >
                            {submitting ? 'Saving...' : 'Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
