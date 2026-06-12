import React from "react";
import { formatCurrency } from "@/lib/utils";
import { CommissionByAgent } from "@/types/comissoes-report";

interface CommissionsTableProps {
    agents: CommissionByAgent[];
}

export function CommissionsTable({ agents }: CommissionsTableProps) {
    const totalLoans = agents.reduce((sum, a) => sum + a.totalLoans, 0);
    const totalCommission = agents.reduce((sum, a) => sum + a.totalCommission, 0);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Detalhamento por Master/Franqueado
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Cargo</th>
                            <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase">Taxa</th>
                            <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase">Total Consignados</th>
                            <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase">Comissão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {agents.map((agent) => (
                            <tr key={`${agent.role}-${agent.id}`} className="hover:bg-gray-50">
                                <td className="py-3 text-sm font-medium text-gray-900">{agent.name}</td>
                                <td className="py-3 text-sm text-gray-500">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${agent.role === "Master"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}>
                                        {agent.role}
                                    </span>
                                </td>
                                <td className="py-3 text-sm text-gray-500 text-right">{agent.commissionRate}%</td>
                                <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(agent.totalLoans)}</td>
                                <td className="py-3 text-sm font-bold text-[#0066A1] text-right">{formatCurrency(agent.totalCommission)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                        <tr>
                            <td className="py-3 text-sm font-bold text-gray-900" colSpan={3}>TOTAL</td>
                            <td className="py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(totalLoans)}</td>
                            <td className="py-3 text-sm font-bold text-[#0066A1] text-right">{formatCurrency(totalCommission)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
