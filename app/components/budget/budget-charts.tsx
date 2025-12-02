import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import type { BudgetItem } from "./types";

interface BudgetChartsProps {
    items: BudgetItem[];
}

export function BudgetCharts({ items }: BudgetChartsProps) {
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

    // Dados para o gráfico de Pizza (Gastos por Categoria)
    const categoryData = items.reduce((acc: any, curr: any) => {
        const existing = acc.find((i: any) => i.name === curr.category);
        if (existing) {
            existing.value += Number(curr.paid_value) || 0;
        } else {
            acc.push({ name: curr.category, value: Number(curr.paid_value) || 0 });
        }
        return acc;
    }, []).filter((i: any) => i.value > 0).sort((a: any, b: any) => b.value - a.value);

    // Dados para o gráfico de Barras (Orçado vs Pago)
    const comparisonData = items.reduce((acc: any, curr: any) => {
        const existing = acc.find((i: any) => i.name === curr.category);
        if (existing) {
            existing.estimated += Number(curr.estimated_value) || 0;
            existing.paid += Number(curr.paid_value) || 0;
        } else {
            acc.push({
                name: curr.category,
                estimated: Number(curr.estimated_value) || 0,
                paid: Number(curr.paid_value) || 0
            });
        }
        return acc;
    }, []).sort((a: any, b: any) => b.estimated - a.estimated).slice(0, 6); // Top 6 categorias

    if (categoryData.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-stone-200 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-stone-700">Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pb-2">
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-stone-200 shadow-sm hidden md:block">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-stone-700">Orçado vs Pago (Top 6)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    interval={0}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(value: any) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="estimated" name="Orçado" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="paid" name="Pago" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
