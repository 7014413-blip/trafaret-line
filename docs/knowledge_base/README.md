# База знаний Trafaret Line

Сами файлы лежат в [`web/data/knowledge_base/`](../../web/data/knowledge_base/): оттуда их читает код сайта, а backend получает копию при сборке (`backend/scripts/sync-shared.mjs`). Так у каждого числа одно место, и правка в JSON сразу меняет цену на сайте и проверку на сервере. Если файл сломан (нет материала, ставка не число), сборка останавливается с названием поля.

| Файл | Что в нём | Кто читает |
| --- | --- | --- |
| [materials.json](../../web/data/knowledge_base/materials.json) | Ставки ₴/м² (розница и опт), минимальные цены, толщина, плотность (акрил 1,19, PET 1,38, полистирол 1,05 г/см³), плата за вырезание одной заготовки (`cutFeeUah`, сейчас 0: Денис 16.10 выбрал «только площадь»), поле станка 1400 × 2000 мм, замеры веса акрила Дениса | `web/lib/materials.ts`, `web/lib/calculators/weight.ts`, расчёт цены на сайте и сервере |
| [rules_logistics.json](../../web/data/knowledge_base/rules_logistics.json) | Тубус или коробка, гофрокартон, объёмный вес, поштомат 40 × 30 × 60 см до 20 кг | `web/lib/calculators/packaging.ts` |
| [rules_fop.json](../../web/data/knowledge_base/rules_fop.json) | Один продавец: ФОП Берчук Наталя Леонідівна, 2 группа, без НДС; какие переменные сервера хранят реквизиты | подвал и оферта, счёт для бизнеса, чек Вчасно.Каса |
| [mock_novaposhta.json](../../web/data/knowledge_base/mock_novaposhta.json) | Ответы API Новой Почты: город, отделение и поштомат, цена, дата, ошибка | юнит-тесты и сквозные тесты оформления |
| [mock_vchasno.json](../../web/data/knowledge_base/mock_vchasno.json) | Ответы Вчасно.Каса: чек, повтор с тем же тегом, остановка | юнит-тесты чеков |
| [mock_opendatabot.json](../../web/data/knowledge_base/mock_opendatabot.json) | Ответы Opendatabot: ТОВ по ЄДРПОУ и ФОП по РНОКПП | юнит-тесты реквизитов для счёта |

Данные в моках выдуманы. Ключей и реквизитов в этих файлах нет: они только в переменных окружения сервера (шаблоны `web/.env.example`, `backend/.env.template`, `bot/.env.example`).
