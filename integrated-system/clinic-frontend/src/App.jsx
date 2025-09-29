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
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  Award,
  Users,
  Heart,
  Shield,
  Sparkles,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Stethoscope,
  Scissors,
  Zap,
  Eye,
  Smile
} from 'lucide-react'
import './App.css'

// 模擬診所資料
const clinicInfo = {
  name: '劉道玄曜診所',
  subtitle: '專業醫美 · 精緻服務 · 安全保障',
  description: '致力於提供最專業的醫美服務，結合先進技術與溫馨服務，讓每位客戶都能擁有自信美麗的人生。',
  address: '台北市信義區信義路五段7號10樓',
  phone: '02-2345-6789',
  email: 'info@flos-clinic.com',
  hours: {
    weekday: '週一至週五 09:00-18:00',
    weekend: '週六 09:00-17:00',
    closed: '週日公休'
  },
  social: {
    instagram: '@flos_clinic',
    facebook: 'FlosClinc',
    youtube: 'FlosClinc'
  }
}

const services = [
  {
    id: 'facial',
    name: '臉部美容',
    icon: <Smile className="h-8 w-8" />,
    description: '專業臉部護理與美容療程',
    treatments: ['肉毒桿菌', '玻尿酸填充', '雷射除斑', '音波拉提'],
    price: 'NT$ 8,000 起',
    duration: '60-90 分鐘',
    popular: true
  },
  {
    id: 'body',
    name: '身體雕塑',
    icon: <Zap className="h-8 w-8" />,
    description: '先進身體雕塑與緊實療程',
    treatments: ['冷凍減脂', '電波拉皮', '超音波溶脂', '體雕療程'],
    price: 'NT$ 15,000 起',
    duration: '90-120 分鐘',
    popular: false
  },
  {
    id: 'skin',
    name: '皮膚治療',
    icon: <Sparkles className="h-8 w-8" />,
    description: '專業皮膚問題診斷與治療',
    treatments: ['痘疤治療', '毛孔縮小', '美白療程', '敏感肌護理'],
    price: 'NT$ 5,000 起',
    duration: '45-60 分鐘',
    popular: false
  },
  {
    id: 'hair',
    name: '毛髮治療',
    icon: <Scissors className="h-8 w-8" />,
    description: '毛髮移植與生髮治療',
    treatments: ['植髮手術', '生髮療程', '雷射除毛', '頭皮護理'],
    price: 'NT$ 20,000 起',
    duration: '120-180 分鐘',
    popular: false
  }
]

const doctors = [
  {
    id: 'dr_liu',
    name: '劉道玄醫師',
    title: '院長 / 整形外科專科醫師',
    specialties: ['臉部整形', '身體雕塑', '微整形'],
    experience: '15年',
    education: ['台大醫學系', '整形外科專科訓練', '美國進修'],
    image: '/api/placeholder/300/400',
    available: true
  },
  {
    id: 'dr_chen',
    name: '陳美麗醫師',
    title: '皮膚科專科醫師',
    specialties: ['皮膚治療', '雷射美容', '抗老療程'],
    experience: '12年',
    education: ['成大醫學系', '皮膚科專科訓練', '歐洲進修'],
    image: '/api/placeholder/300/400',
    available: true
  }
]

const testimonials = [
  {
    id: 1,
    name: '王小姐',
    age: 28,
    treatment: '玻尿酸填充',
    rating: 5,
    comment: '劉醫師的技術非常專業，效果自然，服務也很貼心。診所環境很舒適，讓人很放心。',
    date: '2024-09-15'
  },
  {
    id: 2,
    name: '李先生',
    age: 35,
    treatment: '植髮手術',
    rating: 5,
    comment: '植髮效果超乎預期，醫師很細心地解釋整個過程，術後恢復也很順利。',
    date: '2024-09-10'
  },
  {
    id: 3,
    name: '張小姐',
    age: 32,
    treatment: '雷射除斑',
    rating: 5,
    comment: '斑點明顯淡化了很多，皮膚變得更亮白。護理師的照護也很專業。',
    date: '2024-09-05'
  }
]

function HomePage() {
  const [selectedService, setSelectedService] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8 text-pink-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{clinicInfo.name}</h1>
                <p className="text-xs text-muted-foreground">{clinicInfo.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                立即預約
              </Button>
              <Button size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                線上諮詢
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              專業醫美
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                {' '}美麗人生
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {clinicInfo.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                <Calendar className="h-5 w-5 mr-2" />
                立即預約諮詢
              </Button>
              <Button size="lg" variant="outline">
                <Eye className="h-5 w-5 mr-2" />
                查看服務項目
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              專業服務項目
            </h2>
            <p className="text-xl text-muted-foreground">
              提供全方位的醫美服務，滿足您的美麗需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card 
                key={service.id} 
                className={`hover:shadow-lg transition-all cursor-pointer ${
                  service.popular ? 'ring-2 ring-pink-500' : ''
                }`}
                onClick={() => setSelectedService(service)}
              >
                {service.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-pink-600 to-purple-600">
                      熱門推薦
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full w-fit">
                    <div className="text-pink-600">{service.icon}</div>
                  </div>
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">價格</span>
                      <span className="font-semibold text-pink-600">{service.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">療程時間</span>
                      <span className="text-sm">{service.duration}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">包含項目</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {service.treatments.slice(0, 2).map((treatment, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {treatment}
                          </Badge>
                        ))}
                        {service.treatments.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.treatments.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      了解更多
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              專業醫療團隊
            </h2>
            <p className="text-xl text-muted-foreground">
              經驗豐富的專科醫師，為您提供最安全的醫美服務
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <div className="h-64 md:h-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center">
                      <Stethoscope className="h-16 w-16 text-pink-600" />
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{doctor.name}</h3>
                        <p className="text-muted-foreground">{doctor.title}</p>
                      </div>
                      {doctor.available && (
                        <Badge className="bg-green-100 text-green-800">
                          可預約
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">專長領域</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doctor.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">經驗</span>
                        <p className="text-sm text-muted-foreground">{doctor.experience}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">學經歷</span>
                        <ul className="text-sm text-muted-foreground">
                          {doctor.education.map((edu, index) => (
                            <li key={index}>• {edu}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button className="w-full mt-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        預約 {doctor.name}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              客戶見證
            </h2>
            <p className="text-xl text-muted-foreground">
              真實客戶的美麗蛻變與滿意回饋
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.age}歲 · {testimonial.treatment}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    "{testimonial.comment}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              聯絡我們
            </h2>
            <p className="text-xl text-muted-foreground">
              歡迎預約諮詢，讓我們為您打造專屬的美麗計畫
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>診所資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-pink-600" />
                    <span>{clinicInfo.address}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-pink-600" />
                    <span>{clinicInfo.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-pink-600" />
                    <span>{clinicInfo.email}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>營業時間</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>週一至週五</span>
                    <span>09:00-18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>週六</span>
                    <span>09:00-17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>週日</span>
                    <span className="text-red-500">公休</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>社群媒體</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button variant="outline" size="sm">
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </Button>
                    <Button variant="outline" size="sm">
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                    <Button variant="outline" size="sm">
                      <Youtube className="h-4 w-4 mr-2" />
                      YouTube
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>預約諮詢</CardTitle>
                <CardDescription>
                  填寫表單，我們將盡快與您聯繫安排諮詢時間
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">姓名</Label>
                      <Input id="name" placeholder="請輸入您的姓名" />
                    </div>
                    <div>
                      <Label htmlFor="phone">電話</Label>
                      <Input id="phone" placeholder="請輸入聯絡電話" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="請輸入電子信箱" />
                  </div>
                  <div>
                    <Label htmlFor="service">感興趣的服務</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇服務項目" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">諮詢內容</Label>
                    <Textarea 
                      id="message" 
                      placeholder="請描述您的需求或想了解的內容"
                      rows={4}
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    提交預約申請
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-pink-600" />
                <span className="text-xl font-bold">{clinicInfo.name}</span>
              </div>
              <p className="text-gray-400 mb-4">{clinicInfo.subtitle}</p>
              <p className="text-sm text-gray-400">{clinicInfo.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">服務項目</h3>
              <ul className="space-y-2 text-gray-400">
                {services.map((service) => (
                  <li key={service.id}>
                    <a href="#" className="hover:text-pink-400 transition-colors">
                      {service.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">聯絡資訊</h3>
              <div className="space-y-2 text-gray-400">
                <p>{clinicInfo.address}</p>
                <p>{clinicInfo.phone}</p>
                <p>{clinicInfo.email}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {clinicInfo.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
