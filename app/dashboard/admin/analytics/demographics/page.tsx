'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

interface DemographicData {
    category: string;
    value: string;
    count: number;
    percentage: number;
}

const CATEGORY_LABELS: Record<string, string> = {
    gender: 'Gender',
    age_range: 'Age Range',
    occupation: 'Occupation',
    race_ethnicity: 'Race/Ethnicity',
    marital_status: 'Marital Status'
};

const VALUE_LABELS: Record<string, string> = {
    // Gender
    male: 'Male',
    female: 'Female',
    non_binary: 'Non-binary',
    other: 'Other',
    prefer_not_to_say: 'Prefer not to say',
    not_provided: 'Not Provided',

    // Age
    under_18: 'Under 18',
    '18_24': '18-24',
    '25_34': '25-34',
    '35_44': '35-44',
    '45_54': '45-54',
    '55_64': '55-64',
    '65_plus': '65+',

    // Occupation
    student: 'Student',
    employed_full_time: 'Employed (Full-time)',
    employed_part_time: 'Employed (Part-time)',
    self_employed: 'Self-employed',
    freelancer: 'Freelancer',
    homemaker: 'Homemaker',
    retired: 'Retired',
    unemployed: 'Unemployed',

    // Race/Ethnicity
    american_indian_alaska_native: 'American Indian/Alaska Native',
    asian: 'Asian',
    black_african_american: 'Black/African American',
    hispanic_latino: 'Hispanic/Latino',
    middle_eastern_north_african: 'Middle Eastern/North African',
    native_hawaiian_pacific_islander: 'Native Hawaiian/Pacific Islander',
    white: 'White',
    multiracial: 'Multiracial',

    // Marital Status
    single: 'Single',
    married: 'Married',
    domestic_partnership: 'Domestic Partnership',
    divorced: 'Divorced',
    separated: 'Separated',
    widowed: 'Widowed'
};

export default function AdminDemographicsPage() {
    const [data, setData] = useState<DemographicData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('gender');

    useEffect(() => {
        loadDemographics();
    }, []);

    const loadDemographics = async () => {
        setLoading(true);

        const { data: demographicsData, error } = await supabase.rpc('get_demographics_breakdown');

        if (error) {
            console.error('Error loading demographics:', error);
            showToast.error('Failed to load demographics');
        } else {
            setData(demographicsData || []);
        }

        setLoading(false);
    };

    const getCategoryData = (category: string) => {
        return data.filter(d => d.category === category);
    };

    const getCompletionRate = () => {
        const total = data.find(d => d.value === 'not_provided')?.count || 0;
        const totalUsers = data.reduce((sum, d) => sum + d.count, 0) / 5; // Divide by 5 categories
        const provided = totalUsers - (total / 5);
        return totalUsers > 0 ? ((provided / totalUsers) * 100).toFixed(1) : '0';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading demographics...</p>
                </div>
            </div>
        );
    }

    const categoryData = getCategoryData(selectedCategory);
    const totalResponses = categoryData.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Demographics Analytics</h1>
                    <p className="text-gray-600">Aggregate user demographic data</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Summary Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                        const categoryCount = getCategoryData(key).reduce((sum, d) => sum + d.count, 0);
                        const providedCount = getCategoryData(key).filter(d => d.value !== 'not_provided').reduce((sum, d) => sum + d.count, 0);
                        const rate = categoryCount > 0 ? ((providedCount / categoryCount) * 100).toFixed(0) : '0';

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`p-6 rounded-2xl border-2 transition-all text-left ${selectedCategory === key
                                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <p className="text-sm font-semibold text-gray-600 mb-2">{label}</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{rate}%</p>
                                <p className="text-xs text-gray-500">Response Rate</p>
                            </button>
                        );
                    })}
                </div>

                {/* Selected Category Details */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {CATEGORY_LABELS[selectedCategory]} Breakdown
                        </h2>
                        <p className="text-sm text-gray-500">
                            Total Responses: <span className="font-bold text-gray-900">{totalResponses}</span>
                        </p>
                    </div>

                    {/* Bar Chart */}
                    <div className="space-y-4">
                        {categoryData
                            .sort((a, b) => b.count - a.count)
                            .map((item, index) => (
                                <div key={index} className="group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-700">
                                            {VALUE_LABELS[item.value] || item.value}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500">{item.count} users</span>
                                            <span className="font-bold text-purple-600 text-lg w-16 text-right">
                                                {item.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 group-hover:from-purple-600 group-hover:to-pink-600"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Export Button */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => {
                                const csv = categoryData.map(d =>
                                    `"${VALUE_LABELS[d.value] || d.value}",${d.count},${d.percentage}%`
                                ).join('\n');
                                const blob = new Blob([`Category,Count,Percentage\n${csv}`], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `demographics-${selectedCategory}-${new Date().toISOString().split('T')[0]}.csv`;
                                a.click();
                                showToast.success('CSV exported!');
                            }}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export to CSV
                        </button>
                    </div>
                </div>

                {/* Privacy Notice */}
                <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex gap-3">
                        <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div>
                            <p className="font-bold text-blue-900 mb-1">Privacy & Data Protection</p>
                            <p className="text-sm text-blue-800">
                                All demographic data is aggregated and anonymized. Individual user responses are never displayed or exported.
                                This data is used solely for understanding our user community and improving our services.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
