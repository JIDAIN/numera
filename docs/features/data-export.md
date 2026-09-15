# 个人训练数据导出

本文件定义当前数据导出的长期契约。具体字段以 `src/lib/data-export.ts` 与 `src/lib/data-export-files.ts` 为最终实现事实。

## 导出范围

登录后，用户可以导出当前账号在 Supabase 中已同步的个人 completed 训练，以及独立的分数百分消消乐完成记录。

导出明确不包含：

- 当前浏览器里尚未同步的本地 completed；
- active / abandoned 会话；
- 配对对象的训练数据；
- `pk_challenges`、PK 胜负、对手成绩或挑战状态；
- 草稿纸内容。

PK 应战产生的个人 completed 训练仍属于本人训练数据，因此会按普通个人训练记录导出；不会额外查询 PK challenge 形成第二份记录。

## 文件形式

同一次成功导出生成：

- **XLSX**：面向筛选、透视和人工分析；
- **JSON**：保留原始云端行、规范化训练/逐题结构、消消乐历史和导出警告。

JSON 是机器可读归档，不是已经验证可恢复的备份。当前没有“导入并恢复 Numera 数据”的产品功能。

任一分页读取或文件生成步骤失败时，整次导出失败，不下载一个可能被误认为完整的数据子集。

## 训练级数据

规范化训练记录当前包含：

- 训练 ID；
- 原始 / 标准化训练来源；
- schema、generator、grading、rating 版本；
- `trainingMode`；
- `primarySkillId`；
- 会话级 `difficultyBand`；
- `questionType / subtype`；
- 开始时间与可用的真实完成时间；
- 实际题量、已答题量、正确题数；
- 总有效用时、正确率、平均单题用时、中位单题用时；
- 冻结 Rating（仅适用于存在该语义的记录）。

旧记录缺失新字段时保持为空，不为历史数据猜测新的 A ability、难度或完成时间。

## 逐题数据

逐题导出以冻结 `questions` 为主序列，并按稳定题目 ID 关联作答记录。当前支持保存并导出：

- `skill_id`；
- `difficulty_band`；
- `structure_tags`；
- `target_precision`；
- `mastery_profile`；
- `input_kind`；
- `generator_params`；
- `allowed_answer_set`；
- 题面、正确答案、用户答案、正确性和判定层级；
- 相对误差、单题有效用时、提交/修改次数、跳过与计时中断；
- 通用步骤明细；
- 经典题型的旧结构字段与 `question_data_json`。

因此新的 A V1 数据可以保留正式 ability、难度和结构信息；经典记录继续按原 QuestionType / Subtype / Rating 与旧题型字段导出，不强行改写为新 A 数据。

## 消消乐历史

分数百分消消乐作为独立轻量历史导出，不进入普通 TrainingSession 统计。当前包含记录 ID、角色、开始/完成时间、总用时、关系数量、关系集版本、游戏版本、训练来源和可用的 blueprint fingerprint。

## 时间与数值口径

- 时间同时保留 Unix 毫秒和 ISO-8601；
- 产品导出 ISO 时间使用 `Asia/Shanghai`（`+08:00`）语义；
- 时长基础单位为毫秒；
- 正确率使用 0–1 数值，XLSX 可格式化为百分比；
- UUID、题目 ID、文本答案保持文本语义；
- 旧记录没有真实完成时间时保持为空，不用其他时间字段猜测。

## 权限与隐私

导出使用当前浏览器已有的 Supabase 登录态与 RLS，不使用 service role 或管理员权限。

即使当前账号能够只读查看配对对象历史，导出请求仍限定本人 `owner_id`。导出入口不得把“能看见对方历史”解释成“可以批量导出对方数据”。
