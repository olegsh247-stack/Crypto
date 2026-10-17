# План 100 — коррекция DXY: необязательный контекст (2026-10-16)

## Обязательное решение

**DXY не является блокером готовности первого BTC-сценария.** Это уже утверждено в [BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md](BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md). Это дополнение явно исправляет любое противоречащее упоминание DXY как обязательного блокера в других рабочих заметках.

- Yahoo Finance `DX-Y.NYB` — только ручной research/display reference; не автоматизировать сбор и не распространять данные без разрешения.
- FRED `DTWEXBGS` — отдельный broad-dollar index, не DXY. Использовать только под собственным названием, с собственными датами/свежестью; не записывать в `macro.dxy` и не смешивать с рядом ICE DXY.
- Если ни один контекстный показатель не доступен, пропустить DXY и продолжать первый BTC-сценарий. Дополнительное расследование DXY для первого сценария не требуется.
- ETF publication/revision/finality, rights и стабильность доказательств остаются отдельным gate и не снимаются этим решением.

## Ограничения

Эта коррекция не меняет metric registry/source priority, не разрешает автоматический сбор Yahoo или ICE и не утверждает `DTWEXBGS` в качестве DXY. Capture, production writes, ingestion, scenario evaluation/state/probability changes, deployment и merge не выполнялись. BTC может оставаться `not_evaluable` из-за других открытых gates.

Подробности: [канонический DXY review](BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md), [уточнение различий ICE/Fed](BTC-DXY-SOURCE-CONTRACT-REVIEW-2026-10-16.md), [Промт 100](PROMPT-100-JOURNAL.md).
