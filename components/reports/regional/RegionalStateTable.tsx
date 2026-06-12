import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { StateReportItem } from '@/types/regional-report';

interface RegionalStateTableProps {
    states: StateReportItem[];
}

export function RegionalStateTable({ states }: RegionalStateTableProps) {
    // Totais calculados a partir dos dados recebidos
    const totalLoans = states.reduce((sum, s) => sum + s.totalLoans, 0);
    const totalServidor = states.reduce((sum, s) => sum + s.servidorPublico, 0);
    const totalContratados = states.reduce((sum, s) => sum + s.contratados, 0);
    // Porcentagens globais
    const servidorPctTotal = totalLoans > 0 ? (totalServidor / totalLoans) * 100 : 0;
    const contratadosPctTotal = totalLoans > 0 ? (totalContratados / totalLoans) * 100 : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    Detalhamento por Estado
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Prefeituras
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Servidor Público
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                %
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contratados
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                %
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {states.map((state, index) => {
                            const servidorPercentage = state.totalLoans > 0
                                ? (state.servidorPublico / state.totalLoans) * 100
                                : 0;
                            const contratadosPercentage = state.totalLoans > 0
                                ? (state.contratados / state.totalLoans) * 100
                                : 0;

                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: state.color }}
                                            />
                                            <span className="text-sm font-bold text-gray-900">
                                                {state.state}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {state.prefeituras}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                        {formatCurrency(state.totalLoans)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-[#0066A1]">
                                        {formatCurrency(state.servidorPublico)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[#0066A1]">
                                            {servidorPercentage.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                                        {formatCurrency(state.contratados)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            {contratadosPercentage.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr>
                            <td
                                className="px-6 py-4 text-sm font-bold text-gray-900"
                                colSpan={2}
                            >
                                TOTAL
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                {formatCurrency(totalLoans)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-[#0066A1]">
                                {formatCurrency(totalServidor)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[#0066A1]">
                                    {servidorPctTotal.toFixed(1)}%
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                                {formatCurrency(totalContratados)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    {contratadosPctTotal.toFixed(1)}%
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
