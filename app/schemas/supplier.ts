import { z } from "zod";

export const SupplierSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    category: z.string().min(1, "Categoria é obrigatória"),
    status: z.enum(["pesquisando", "negociando", "contratado", "pago"]).default("pesquisando"),
    price: z.coerce.number().min(0, "O valor não pode ser negativo").optional(),
    contact_info: z.string().optional().nullable(),
    rating: z.coerce.number().min(0).max(5).optional(),
    notes: z.string().optional().nullable(),
    photo_url: z.string().optional().nullable(),
    contract_url: z.string().optional().nullable(),
});

export type SupplierInput = z.infer<typeof SupplierSchema>;
