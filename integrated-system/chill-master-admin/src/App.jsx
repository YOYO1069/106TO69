import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe, 
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Server
} from 'lucide-react'
import './App.css'

// 模擬數據
const mockTenants = [
  {
    id: 'tenant_001',
    name: '劉道玄曜診所',
    contact: 'dr.liu@flos-clinic.com',
    plan: 'Premium',
    status: 'active',
    monthlyFee: 'NT$ 3,280',
    frontendUrl: 'https://jolly-gelato-4f420b.netlify.app',
    managementUrl: 'https://legendary-naiad-68a004.netlify.app',
    features: ['預約系統', 'CRM', '醫師管理', '數據分析', 'VIP管理']
  },
  {
    id: 'tenant_002',
    name: '美麗人生診所',
    contact: 'admin@beautiful-life.com',
    plan: 'Basic',
    status: 'active',
    monthlyFee: 'NT$ 1,280',
    frontendUrl: 'https://heartfelt-flan-8e2dbf.netlify.app',
    managementUrl: 'https://flourishing-manatee-b32d82.netlify.app',
    features: ['預約系統', 'CRM', '醫師管理']
  },
  {
    id: 'tenant_003',
    name: '青春美學中心',
    contact: 'info@youth-aesthetics.com',
    plan: 'Enterprise',
    status: 'pending',
    monthlyFee: 'NT$ 5,280',
    frontendUrl: 'https://vermillion-bonbon-72aa32.netlify.app',
    managementUrl: null,
    features: ['預約系統', 'CRM', '醫師管理', '數據分析', 'VIP管理', '庫存管理', 'AI助手']
  }
]

const mockSystemStatus = {
  googleCalendar: 'healthy',
  lineBot: 'healthy',
  n8nAutomation: 'warning',
  zeaburServices: 'healthy',
  hotkeBooking: 'error'
}

const mockStats = {
  totalTenants: 3,
  activeTenants: 2,
  monthlyRevenue: 'NT$ 9,840',
  automationFlows: 12
}

function Dashboard() {
  const [selectedTenant, setSelectedTenant] = useState(null)

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
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
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CHiLL 總管理後台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                系統運行中
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">總覽</TabsTrigger>
            <TabsTrigger value="tenants">租戶管理</TabsTrigger>
            <TabsTrigger value="permissions">權限管理</TabsTrigger>
            <TabsTrigger value="automation">自動化</TabsTrigger>
            <TabsTrigger value="monitoring">監控</TabsTrigger>
          </TabsList>

          {/* 總覽頁面 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">總租戶數</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalTenants}</div>
                  <p className="text-xs text-muted-foreground">
                    +1 較上月
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">活躍租戶</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.activeTenants}</div>
                  <p className="text-xs text-muted-foreground">
                    66.7% 活躍率
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">月營收預估</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.monthlyRevenue}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% 較上月
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">自動化流程</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.automationFlows}</div>
                  <p className="text-xs text-muted-foreground">
                    運行中
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 系統狀態監控 */}
            <Card>
              <CardHeader>
                <CardTitle>系統狀態監控</CardTitle>
                <CardDescription>關鍵整合服務的運行狀態</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(mockSystemStatus.googleCalendar)}
                    <span className="text-sm">Google Calendar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(mockSystemStatus.lineBot)}
                    <span className="text-sm">LINE Bot</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(mockSystemStatus.n8nAutomation)}
                    <span className="text-sm">n8n 自動化</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(mockSystemStatus.zeaburServices)}
                    <span className="text-sm">Zeabur 服務</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(mockSystemStatus.hotkeBooking)}
                    <span className="text-sm">夯客預約</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用的管理功能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <Plus className="h-6 w-6" />
                    <span>新增租戶</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <Zap className="h-6 w-6" />
                    <span>部署自動化</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>查看報表</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <Server className="h-6 w-6" />
                    <span>系統維護</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 租戶管理頁面 */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">租戶管理</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增租戶
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockTenants.map((tenant) => (
                <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                        <CardDescription>{tenant.contact}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(tenant.status)}>
                        {tenant.status === 'active' ? '活躍' : tenant.status === 'pending' ? '待啟用' : '停用'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">方案</span>
                      <Badge variant="outline">{tenant.plan}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">月費</span>
                      <span className="font-semibold">{tenant.monthlyFee}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">功能模組</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tenant.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        管理
                      </Button>
                      {tenant.frontendUrl && (
                        <Button size="sm" variant="outline" className="flex-1">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          訪問
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 權限管理頁面 */}
          <TabsContent value="permissions" className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">權限管理</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>CHiLL 後台管理</span>
                  </CardTitle>
                  <CardDescription>
                    總管理員專屬介面，用於配置和下放系統功能
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    進入管理
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>網站權限管理</span>
                  </CardTitle>
                  <CardDescription>
                    管理所有網站的最高權限和功能分配
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    進入管理
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>員工權限管理</span>
                  </CardTitle>
                  <CardDescription>
                    診所內部員工功能訪問權限控制
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    進入管理
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 自動化頁面 */}
          <TabsContent value="automation" className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">n8n 自動化管理</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>自動化解決方案庫</CardTitle>
                <CardDescription>預設的 n8n 自動化方案，可快速部署到租戶</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">醫美診所自動化</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        包含預約通知、客戶追蹤、行銷自動化等流程
                      </p>
                      <Button size="sm" className="w-full">套用方案</Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">QR 變形追蹤系統</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        QR Code 生成、掃描追蹤、數據分析自動化
                      </p>
                      <Button size="sm" className="w-full">套用方案</Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">比較網站自動化</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        數據採集、比較分析、內容更新自動化
                      </p>
                      <Button size="sm" className="w-full">套用方案</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>n8n API 互動工具</CardTitle>
                <CardDescription>直接管理 n8n 工作流程</CardDescription>
              </CardHeader>
              <CardContent>
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  開啟 n8n 管理介面
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 監控頁面 */}
          <TabsContent value="monitoring" className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">系統監控</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Zeabur 服務狀態</CardTitle>
                  <CardDescription>監控部署在 Zeabur 上的服務</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>n8n 實例</span>
                      <Badge className="bg-green-100 text-green-800">運行中</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>API 服務</span>
                      <Badge className="bg-green-100 text-green-800">運行中</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>資料庫</span>
                      <Badge className="bg-green-100 text-green-800">運行中</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API 使用統計</CardTitle>
                  <CardDescription>今日 API 呼叫統計</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>總請求數</span>
                      <span className="font-semibold">1,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>成功率</span>
                      <span className="font-semibold text-green-600">99.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>平均回應時間</span>
                      <span className="font-semibold">245ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
