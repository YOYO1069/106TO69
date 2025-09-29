import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { 
  FileText, 
  BarChart3, 
  GitCompare, 
  Upload, 
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Zap,
  Target,
  TrendingUp,
  FileCheck,
  Clock,
  Users,
  Star
} from 'lucide-react'
import './App.css'

// 模擬比較數據
const mockComparisons = [
  {
    id: 'comp_001',
    name: '診所管理系統功能比較',
    type: 'feature',
    status: 'completed',
    createdAt: '2024-09-25',
    files: [
      { name: 'CHiLL系統功能清單.xlsx', type: 'excel' },
      { name: '競品A功能清單.xlsx', type: 'excel' }
    ],
    results: {
      similarity: 85,
      differences: 12,
      advantages: 8,
      recommendations: 5
    }
  },
  {
    id: 'comp_002',
    name: '價格方案對比分析',
    type: 'pricing',
    status: 'processing',
    createdAt: '2024-09-24',
    files: [
      { name: '我方價格表.pdf', type: 'pdf' },
      { name: '市場價格調研.csv', type: 'csv' }
    ],
    results: {
      similarity: 0,
      differences: 0,
      advantages: 0,
      recommendations: 0
    }
  },
  {
    id: 'comp_003',
    name: '技術架構比較',
    type: 'technical',
    status: 'completed',
    createdAt: '2024-09-23',
    files: [
      { name: '技術規格文件.docx', type: 'word' },
      { name: '競品技術分析.pdf', type: 'pdf' }
    ],
    results: {
      similarity: 72,
      differences: 18,
      advantages: 15,
      recommendations: 8
    }
  }
]

const comparisonTypes = [
  {
    id: 'feature',
    name: '功能比較',
    description: '比較不同系統的功能特性',
    icon: <FileCheck className="h-6 w-6" />,
    color: 'bg-blue-500'
  },
  {
    id: 'pricing',
    name: '價格分析',
    description: '分析價格策略與競爭力',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'bg-green-500'
  },
  {
    id: 'technical',
    name: '技術對比',
    description: '技術架構與實現方式比較',
    icon: <Settings className="h-6 w-6" />,
    color: 'bg-purple-500'
  },
  {
    id: 'market',
    name: '市場分析',
    description: '市場定位與競爭分析',
    icon: <Target className="h-6 w-6" />,
    color: 'bg-orange-500'
  }
]

function ComparisonDashboard() {
  const [selectedComparison, setSelectedComparison] = useState(null)
  const [uploadFiles, setUploadFiles] = useState([])
  const [comparisonType, setComparisonType] = useState('')

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <GitCompare className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">多維度檔案比較服務</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                智能分析中
              </Badge>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                新增比較
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">儀表板</TabsTrigger>
            <TabsTrigger value="compare">新增比較</TabsTrigger>
            <TabsTrigger value="results">比較結果</TabsTrigger>
            <TabsTrigger value="analytics">分析報告</TabsTrigger>
          </TabsList>

          {/* 儀表板頁面 */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">總比較次數</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">
                    +3 較上週
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">完成分析</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground">
                    75% 完成率
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">平均相似度</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78.5%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.3% 較上月
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">優勢項目</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">31</div>
                  <p className="text-xs text-muted-foreground">
                    識別的優勢
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 比較類型快速選擇 */}
            <Card>
              <CardHeader>
                <CardTitle>比較類型</CardTitle>
                <CardDescription>選擇適合的比較分析類型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {comparisonTypes.map((type) => (
                    <Card key={type.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className={`mx-auto mb-4 p-3 ${type.color} rounded-full w-fit`}>
                          <div className="text-white">{type.icon}</div>
                        </div>
                        <h3 className="font-semibold mb-2">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                        <Button size="sm" variant="outline" className="mt-4 w-full">
                          開始比較
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 最近的比較 */}
            <Card>
              <CardHeader>
                <CardTitle>最近的比較</CardTitle>
                <CardDescription>查看最新的比較分析結果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockComparisons.map((comparison) => (
                    <div key={comparison.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(comparison.status)}
                        <div>
                          <h4 className="font-medium">{comparison.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {comparison.files.length} 個檔案 • {comparison.createdAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(comparison.status)}>
                          {comparison.status === 'completed' ? '已完成' : 
                           comparison.status === 'processing' ? '處理中' : '失敗'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 新增比較頁面 */}
          <TabsContent value="compare" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>上傳檔案</CardTitle>
                  <CardDescription>上傳需要比較的檔案（支援 PDF、Word、Excel、CSV）</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      拖拽檔案到此處或點擊上傳
                    </p>
                    <Button variant="outline">
                      選擇檔案
                    </Button>
                  </div>
                  
                  {uploadFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>已上傳檔案</Label>
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button size="sm" variant="ghost">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>比較設定</CardTitle>
                  <CardDescription>配置比較分析的參數</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comparison-name">比較名稱</Label>
                    <Input id="comparison-name" placeholder="輸入比較分析的名稱" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="comparison-type">比較類型</Label>
                    <Select value={comparisonType} onValueChange={setComparisonType}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇比較類型" />
                      </SelectTrigger>
                      <SelectContent>
                        {comparisonTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="comparison-description">描述</Label>
                    <Textarea 
                      id="comparison-description" 
                      placeholder="描述這次比較的目的和重點"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>分析選項</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="similarity" className="rounded" />
                        <Label htmlFor="similarity" className="text-sm">相似度分析</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="differences" className="rounded" />
                        <Label htmlFor="differences" className="text-sm">差異識別</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="advantages" className="rounded" />
                        <Label htmlFor="advantages" className="text-sm">優勢分析</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="recommendations" className="rounded" />
                        <Label htmlFor="recommendations" className="text-sm">改進建議</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    開始分析
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 比較結果頁面 */}
          <TabsContent value="results" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">比較結果</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  篩選
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  匯出
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {mockComparisons.filter(c => c.status === 'completed').map((comparison) => (
                <Card key={comparison.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{comparison.name}</CardTitle>
                        <CardDescription>{comparison.createdAt}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(comparison.status)}>
                        已完成
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{comparison.results.similarity}%</div>
                        <div className="text-xs text-muted-foreground">相似度</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{comparison.results.differences}</div>
                        <div className="text-xs text-muted-foreground">差異項目</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{comparison.results.advantages}</div>
                        <div className="text-xs text-muted-foreground">優勢項目</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{comparison.results.recommendations}</div>
                        <div className="text-xs text-muted-foreground">建議項目</div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">比較檔案</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comparison.files.map((file, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {file.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      查看詳細報告
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 分析報告頁面 */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">分析報告</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>比較趨勢分析</CardTitle>
                  <CardDescription>過去30天的比較活動趨勢</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mb-4" />
                    <p>趨勢圖表將在此顯示</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>競爭優勢分析</CardTitle>
                  <CardDescription>基於比較結果的優勢統計</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">功能完整性</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">價格競爭力</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '72%'}}></div>
                        </div>
                        <span className="text-sm font-medium">72%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">技術先進性</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: '90%'}}></div>
                        </div>
                        <span className="text-sm font-medium">90%</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">用戶體驗</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{width: '78%'}}></div>
                        </div>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>改進建議摘要</CardTitle>
                <CardDescription>基於所有比較分析的綜合建議</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">功能增強建議</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      建議增加AI智能推薦功能，提升用戶體驗和系統智能化程度。
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <h4 className="font-semibold text-green-900 dark:text-green-100">價格策略優化</h4>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      可考慮推出更靈活的定價方案，以提高市場競爭力。
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100">技術架構升級</h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                      建議採用微服務架構，提升系統的可擴展性和維護性。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ComparisonDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
