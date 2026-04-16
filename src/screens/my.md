## 获取用户创作的视频列表

**接口地址**:`/facial/app/user/myVideos`

**请求方式**:`GET`

**请求数据类型**:`application/x-www-form-urlencoded`

**响应数据类型**:`*/*`

**接口描述**:

**请求参数**:

**请求参数**:

| 参数名称 | 参数说明     | 请求类型 | 是否必须 | 数据类型       | schema |
| -------- | ------------ | -------- | -------- | -------------- | ------ |
| token    | 鉴权 token   | header   | true     | string         |        |
| pageNum  | 页码         | query    | false    | integer(int32) |        |
| pageSize | 每页数量     | query    | false    | integer(int32) |        |
| status   | 视频状态筛选 | query    | false    | string         |        |

**响应状态**:

| 状态码 | 说明         | schema                 |
| ------ | ------------ | ---------------------- |
| 200    | OK           | 分页返回«AppVideoTask» |
| 401    | Unauthorized |                        |
| 403    | Forbidden    |                        |
| 404    | Not Found    |                        |

**响应参数**:

| 参数名称                      | 参数说明                                                           | 类型              | schema         |
| ----------------------------- | ------------------------------------------------------------------ | ----------------- | -------------- |
| exception                     | 异常信息                                                           | string            |                |
| list                          | 返回结果集                                                         | array             | AppVideoTask   |
| &emsp;&emsp;actionType        | 动作类型                                                           | string            |                |
| &emsp;&emsp;aiServiceProvider | AI 服务提供商                                                      | string            |                |
| &emsp;&emsp;aiTaskId          | AI 服务任务 ID                                                     | string            |                |
| &emsp;&emsp;createdTime       | 创建时间                                                           | string(date-time) |                |
| &emsp;&emsp;duration          | 视频时长（秒）                                                     | integer(int32)    |                |
| &emsp;&emsp;errorMessage      | 错误信息                                                           | string            |                |
| &emsp;&emsp;fromFeedId        | 创作来源 Feed                                                      | integer(int64)    |                |
| &emsp;&emsp;id                | 主键 ID                                                            | integer(int64)    |                |
| &emsp;&emsp;modifiedTime      | 修改时间                                                           | string(date-time) |                |
| &emsp;&emsp;petImageUrl       | 宠物图片 URL                                                       | string            |                |
| &emsp;&emsp;promptText        | 用户输入的 AI 提示语                                               | string            |                |
| &emsp;&emsp;removeWatermark   | 是否移除水印：1-是, 0-否                                           | boolean           |                |
| &emsp;&emsp;shareToCommunity  | 是否分享到社区：1-是, 0-否                                         | boolean           |                |
| &emsp;&emsp;status            | 状态：PENDING-待处理, PROCESSING-生成中, SUCCESS-成功, FAILED-失败 | string            |                |
| &emsp;&emsp;taskId            | 任务 ID（UUID）                                                    | string            |                |
| &emsp;&emsp;templateId        | 使用的模版 ID                                                      | string            |                |
| &emsp;&emsp;thumbnailUrl      | 缩略图 URL                                                         | string            |                |
| &emsp;&emsp;userId            | 用户 ID                                                            | integer(int64)    |                |
| &emsp;&emsp;videoUrl          | 生成的视频 URL                                                     | string            |                |
| message                       | 错误提示                                                           | string            |                |
| pageNum                       | 当前页                                                             | integer(int64)    | integer(int64) |
| pageSize                      | 每页记录数                                                         | integer(int64)    | integer(int64) |
| responseCode                  | 响应码                                                             | string            |                |
| totalPage                     | 总分页数                                                           | integer(int64)    | integer(int64) |
| totalRecord                   | 总记录数                                                           | integer(int64)    | integer(int64) |
| traceId                       | 接口请求的 traceId                                                 | string            |                |

**响应示例**:

```javascript
{
	"exception": "",
	"list": [
		{
			"actionType": "",
			"aiServiceProvider": "",
			"aiTaskId": "",
			"createdTime": "",
			"duration": 0,
			"errorMessage": "",
			"fromFeedId": 0,
			"id": 0,
			"modifiedTime": "",
			"petImageUrl": "",
			"promptText": "",
			"removeWatermark": true,
			"shareToCommunity": true,
			"status": "",
			"taskId": "",
			"templateId": "",
			"thumbnailUrl": "",
			"userId": 0,
			"videoUrl": ""
		}
	],
	"message": "",
	"pageNum": 0,
	"pageSize": 0,
	"responseCode": "",
	"totalPage": 0,
	"totalRecord": 0,
	"traceId": ""
}
```
