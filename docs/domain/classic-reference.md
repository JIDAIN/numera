# Classic Compatibility Reference

本文只维护 Classic 训练的稳定查表资料。它不定义 A Mastery，也不定义 C 项目规则。

## 1. Rating

版本：2.0.0。

Classic Rating 同时要求速度和正确题数。标准用时按冻结题组实际题量相对标准题量线性缩放。

准确率门槛：优秀97.5%、良好95%、合格90%；10题特殊规则为优秀10/10，良好和合格至少9/10。

A 不使用本 Rating；C 也不使用本 Rating。

| QuestionType / Subtype | 标准题量 | 优秀 | 良好 | 合格 |
|---|---:|---:|---:|---:|
| two_by_one_multiply / standard | 40 | 60s | 75s | 90s |
| two_digit_add_subtract / standard | 40 | 80s | 100s | 120s |
| three_digit_add_subtract / standard | 40 | 120s | 150s | 180s |
| two_by_two_multiply / standard | 20 | 120s | 150s | 180s |
| two_by_two_multiply / carry_intensive | 20 | 120s | 150s | 180s |
| three_by_two_division / quotient_first | 20 | 40s | 50s | 60s |
| three_by_two_division / quotient_two | 20 | 180s | 210s | 240s |
| three_by_two_division / quotient_estimate_3_percent | 20 | 80s | 100s | 120s |
| multi_digit_division / quotient_two | 20 | 180s | 210s | 240s |
| multi_number_add_subtract / standard | 20 | 120s | 150s | 180s |
| fraction_percent_conversion / fraction_to_percent | 40 | 70s | 85s | 100s |
| fraction_percent_conversion / percent_to_fraction | 40 | 80s | 95s | 110s |
| fraction_comparison / comparison | 40 | 100s | 120s | 140s |
| special_hundred_scaling_division / hundred_scaling | 20 | 150s | 180s | 220s |

Executable source：src/lib/statistics.ts 的 TARGETS / ratingStandards。

新完成的 Classic 会冻结 RatingSnapshot；旧记录没有快照时按兼容逻辑读取，不回写历史。

## 2. Fixed Fraction–Percent Library

Classic fraction-percent conversion 维护46组固定关系。两个方向共用同一关系表，不维护两份答案。

| Fraction | Percent |
|---|---:|
| 1/3 | 33.3% |
| 1/4 | 25% |
| 1/5 | 20% |
| 1/6 | 16.7% |
| 1/7 | 14.3% |
| 1/8 | 12.5% |
| 1/9 | 11.1% |
| 1/10 | 10% |
| 1/11 | 9.1% |
| 1/12 | 8.3% |
| 1/13 | 7.7% |
| 1/14 | 7.1% |
| 1/15 | 6.7% |
| 1/16 | 6.25% |
| 1/17 | 5.9% |
| 1/18 | 5.6% |
| 1/19 | 5.3% |
| 1/20 | 5% |
| 1/25 | 4% |
| 1/40 | 2.5% |
| 1/50 | 2% |
| 2/3 | 66.7% |
| 3/4 | 75% |
| 2/5 | 40% |
| 3/5 | 60% |
| 4/5 | 80% |
| 5/6 | 83.3% |
| 2/7 | 28.6% |
| 3/7 | 42.9% |
| 4/7 | 57.1% |
| 5/7 | 71.4% |
| 6/7 | 85.7% |
| 3/8 | 37.5% |
| 5/8 | 62.5% |
| 7/8 | 87.5% |
| 2/9 | 22.2% |
| 4/9 | 44.4% |
| 5/9 | 55.6% |
| 7/9 | 77.8% |
| 8/9 | 88.9% |
| 5/12 | 41.7% |
| 7/12 | 58.3% |
| 11/12 | 91.7% |
| 3/16 | 18.75% |
| 5/16 | 31.25% |
| 7/16 | 43.75% |

Classic题面沿用既有“≈”语义；percent→fraction 使用表中的预设最简分数。

Executable source：src/lib/generate.ts 的 FRACTION_PERCENT_LIBRARY。完整性测试：src/lib/generate.test.ts。

## 3. Match Relation Set

Fraction-percent Match 不维护第二份 percent 答案表。src/lib/fraction-percent-match.ts 只维护参与游戏的 fraction keys，再从 FRACTION_PERCENT_LIBRARY 取实际关系。当前 Match 使用32组子集。

A-FRA-01 有自己的 canonical A 产品定义和 generator；不能把这46组 Classic library 当成 A-FRA-01 的正式能力规则。

## 4. Maintenance

修改 Classic Rating 或 fixed library 时：先改 executable source，再同步测试与本 reference；不自动影响 A/C。
