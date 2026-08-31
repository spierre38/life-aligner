'use client';

import { motion } from 'framer-motion';

type ConstellationMapProps = {
    activeSection: 'intro' | 'values' | 'interests' | 'categories' | 'purpose';
};

export default function LifeFrameConstellationMap({ activeSection }: ConstellationMapProps) {
    const nodes = [
        { id: 'values', x: 60, y: 40, color: 'rgb(168, 85, 247)' }, // Purple
        { id: 'interests', x: 120, y: 80, color: 'rgb(236, 72, 153)' }, // Pink
        { id: 'categories', x: 60, y: 120, color: 'rgb(99, 102, 241)' }, // Indigo
        { id: 'purpose', x: 90, y: 160, color: 'rgb(251, 191, 36)' } // Yellow/Gold
    ];

    const connections = [
        { from: 'values', to: 'interests' },
        { from: 'values', to: 'categories' },
        { from: 'interests', to: 'categories' },
        { from: 'interests', to: 'purpose' },
        { from: 'categories', to: 'purpose' }
    ];

    const getNodePosition = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
    };

    const isNodeActive = (nodeId: string) => {
        return activeSection === nodeId;
    };

    const isConnectionActive = (from: string, to: string) => {
        const order = ['values', 'interests', 'categories', 'purpose'];
        const activeIndex = order.indexOf(activeSection);
        const fromIndex = order.indexOf(from);
        const toIndex = order.indexOf(to);
        return activeIndex >= Math.max(fromIndex, toIndex);
    };

    return (
        <div className="fixed top-20 right-8 z-50 hidden md:block">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-white text-xs font-semibold mb-4 text-center">
                    Your Journey
                </div>
                <svg width="180" height="200" viewBox="0 0 180 200">
                    {/* Connection Lines */}
                    {connections.map(({ from, to }) => {
                        const fromPos = getNodePosition(from);
                        const toPos = getNodePosition(to);
                        const isActive = isConnectionActive(from, to);

                        return (
                            <motion.line
                                key={`${from}-${to}`}
                                x1={fromPos.x}
                                y1={fromPos.y}
                                x2={toPos.x}
                                y2={toPos.y}
                                stroke={isActive ? 'rgba(168, 85, 247, 0.6)' : 'rgba(255, 255, 255, 0.1)'}
                                strokeWidth={isActive ? '2' : '1'}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: isActive ? 1 : 0 }}
                                transition={{ duration: 0.8 }}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const isActive = isNodeActive(node.id);
                        const isPassed = ['values', 'interests', 'categories', 'purpose'].indexOf(activeSection) >
                            ['values', 'interests', 'categories', 'purpose'].indexOf(node.id);

                        return (
                            <g key={node.id}>
                                {/* Glow effect for active node */}
                                {isActive && (
                                    <motion.circle
                                        cx={node.x}
                                        cy={node.y}
                                        r="20"
                                        fill={node.color}
                                        opacity="0.3"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}

                                {/* Main node */}
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r="8"
                                    fill={isActive || isPassed ? node.color : 'rgba(255, 255, 255, 0.2)'}
                                    stroke={isActive ? 'white' : 'rgba(255, 255, 255, 0.3)'}
                                    strokeWidth={isActive ? '2' : '1'}
                                    animate={{
                                        scale: isActive ? [1, 1.2, 1] : 1
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: isActive ? Infinity : 0
                                    }}
                                />

                                {/* Label */}
                                <text
                                    x={node.x + 15}
                                    y={node.y + 5}
                                    fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
                                    fontSize="10"
                                    fontWeight={isActive ? 'bold' : 'normal'}
                                    className="capitalize"
                                >
                                    {node.id}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Progress indicator */}
                <div className="mt-4">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: '0%' }}
                            animate={{
                                width:
                                    activeSection === 'intro' ? '0%' :
                                        activeSection === 'values' ? '25%' :
                                            activeSection === 'interests' ? '50%' :
                                                activeSection === 'categories' ? '75%' :
                                                    '100%'
                            }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <div className="text-center mt-2 text-xs text-white/60">
                        {activeSection === 'intro' && 'Start'}
                        {activeSection === 'values' && '25% Complete'}
                        {activeSection === 'interests' && '50% Complete'}
                        {activeSection === 'categories' && '75% Complete'}
                        {activeSection === 'purpose' && '100% Complete'}
                    </div>
                </div>
            </div>
        </div>
    );
}