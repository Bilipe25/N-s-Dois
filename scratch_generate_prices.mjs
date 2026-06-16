import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eamcrftdbhugeyrreiij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbWNyZnRkYmh1Z2V5cnJlaWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Mjc4ODcsImV4cCI6MjA5NDEwMzg4N30.drq7x7-uT2nwafrUACEDwaK9E0LGLF1U4M7kPAOGdjM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    const { data: gifts, error } = await supabase.from('bridal_shower_gifts').select('id, item_name, price_range');
    
    if (error) {
        console.error('Error fetching gifts:', error);
        process.exit(1);
    }

    const priceDictionary = [
        { regex: /geladeira|fogão|máquina de lavar|tv|televisão/i, range: "Acima de R$ 1000" },
        { regex: /micro-ondas|microondas|airfryer|aspirador|liquidificador|batedeira|cafeteira/i, range: "R$ 150 a R$ 400" },
        { regex: /jogo de panelas|faqueiro|aparelho de jantar|churrasqueira/i, range: "R$ 200 a R$ 500" },
        { regex: /panela|frigideira|assadeira|forma|tábua|ferro|liquidificador/i, range: "R$ 50 a R$ 150" },
        { regex: /toalha|lençol|edredom|travesseiro|manta|roupa de cama/i, range: "R$ 80 a R$ 200" },
        { regex: /colher|garfo|faca|concha|espátula|abridor|pegador|ralador|peneira/i, range: "Até R$ 50" },
        { regex: /copo|taça|jarra|xícara|caneca|prato|tigela|bowl/i, range: "R$ 30 a R$ 100" },
        { regex: /pote|tupperware|lixeira|escorredor|rodo|vassoura|balde/i, range: "R$ 20 a R$ 80" }
    ];

    let sql = `-- Script gerado automaticamente para preencher faixas de preço\n\n`;

    gifts.forEach(gift => {
        if (!gift.price_range || gift.price_range.trim() === '') {
            let suggestedPrice = "R$ 50 a R$ 150"; // default fallback
            for (const item of priceDictionary) {
                if (item.regex.test(gift.item_name)) {
                    suggestedPrice = item.range;
                    break;
                }
            }
            
            const safeId = gift.id;
            const safePrice = suggestedPrice.replace(/'/g, "''");
            
            sql += `UPDATE bridal_shower_gifts SET price_range = '${safePrice}' WHERE id = '${safeId}'; -- ${gift.item_name}\n`;
        }
    });

    console.log(sql);
}

main();
