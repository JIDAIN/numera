# Data, Identity & Sync

本文维护 Numera 当前 session 数据、IndexedDB、Supabase、身份、ownership、sync 与 export source boundary。

精确字段以 src/lib/types.ts、src/lib/storage.ts、src/lib/cloud.ts 与 Supabase migrations 为 executable source。

## 1. Data Boundary

普通训练核心对象：

~~~text
GeneratedQuestion
→ TrainingSession
→ QuestionRecord
→ completed TrainingSession
~~~

当前 Session 支持 schemaVersion 1/2/3。schema-v3 用于 C shell；旧 Classic/A 记录继续按原语义兼容读取。

## 2. Local Storage

普通训练 IndexedDB 当前历史数据库名仍为 speed-math-v1，object store 为 sessions。该名称属于历史兼容标识，不代表当前品牌。

Storage boundary 会 normalize release-added fields，避免旧冻结记录因为新字段缺失而失效。

当前规则：

- active 只保留当前浏览器；
- completed 保留本地长期记录；
- 旧记录缺失 questionCount 时以 frozen questions.length 解释；
- 老 active 分数比较若含当前UI已无法回答的 equality，会拒绝恢复；
- completed history保留冻结grading，不做大规模重算。

## 3. Identity

Supabase Auth user + profiles.role 决定固定 fish / cat 身份。

TrainingSession 可保存 ownerAccountId。UI显示角色不能改变真实owner。

未登录本地记录和已绑定账号记录保持隔离；配对对象云端历史可以只读查看。

## 4. Completed Sync

普通 completed flow：

~~~text
complete
→ save IndexedDB
→ if authenticated + ownerAccountId
→ sync_completed_training_session RPC
→ mark synced / retain local record
~~~

云端行以 session_id 唯一识别；读取历史时本地与云端相同稳定ID去重。

Supabase主表：completed_training_sessions。

syncCompleted 上传 frozen session_data，并保存 generator/grading/rating/schema版本。

## 5. Active Sessions

active 不上传云端，不提供跨设备恢复。

这意味着：

- 刷新/同浏览器恢复依赖 IndexedDB；
- 切换设备不会取得另一设备 active；
- active PK也只存在挑战者当前浏览器。

跨设备 active 不是 current capability。

## 6. Partner Read

readCloudHistory 依赖 Supabase RLS/RPC允许固定配对成员查看历史。

Product层可以展示对方记录，但：

- 对方记录只读；
- 同步/重试操作只针对本人；
- export 仍只读取本人 owner_id。

## 7. PK Data

pk_challenges 保存：

- challenger/opponent身份；
- source_session_id；
- frozen_session；
- opponent_session_id；
- pending/completed状态；
- created/completed时间。

创建、提交、已读等通过 Supabase RPC 完成。PK result 绑定个人 completed Session，而不是创建第三条统计训练。

## 8. Fraction-percent Match

Match 使用独立 local/cloud storage 和独立 PK 表/函数，不混入普通 TrainingSession history。

相关实现：

- src/lib/fraction-percent-match-storage.ts
- src/lib/fraction-percent-match-cloud.ts
- src/lib/fraction-percent-match-pk-cloud.ts

## 9. Export Source Boundary

个人训练导出只读：

- 当前登录账号 owner_id 下的云端 completed_training_sessions；
- 当前登录账号自己的 Match 云端记录。

不读：

- 本地未同步 completed；
- active；
- partner数据；
- pk_challenges。

data-export 会规范化历史记录，但缺失的新语义保持空值，不为旧记录猜 ability/C metadata。

当前 export schema version = 2.1.0。

## 10. Compatibility

兼容原则：

- Classic frozen records保持原义；
- C-*历史 skillId只读兼容，不作为新C身份；
- schema升级在读边界 normalize；
- 不为了文档整齐批量重写历史数据；
- 已执行 Supabase migration 不回改。

## 11. Security / Ownership

- browser使用 Supabase publishable client + Auth；
- owner由认证身份与数据库约束决定；
- UI不是安全边界；
- 真实 secret 不提交Git；
- Production数据写入与Vercel部署是不同授权动作。

## 12. Current Anchors

- src/lib/types.ts
- src/lib/storage.ts
- src/lib/cloud.ts
- src/lib/data-export.ts
- src/lib/data-export-files.ts
- src/lib/fraction-percent-match-*.ts
- supabase/migrations/*