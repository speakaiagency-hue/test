import { useState } from "react";
import { Lock, LogOut, Plus, Edit2, Trash2, BookOpen, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("adminLoggedIn") === "true");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [courses, setCourses] = useState([
    {
      id: "1",
      title: "React Avançado",
      description: "Domine padrões avançados e performance em React",
      level: "avançado",
    },
    {
      id: "2",
      title: "Web Design Moderno",
      description: "Aprenda a criar interfaces incríveis com Tailwind CSS",
      level: "intermediário",
    },
    {
      id: "3",
      title: "JavaScript do Zero",
      description: "Fundamentos completos de JavaScript para iniciantes",
      level: "iniciante",
    },
  ]);

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    level: "intermediário" as const,
  });

  const [editingCourse, setEditingCourse] = useState<any>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      toast({ title: "Login realizado com sucesso!" });
      setPassword("");
    } else {
      toast({ title: "Senha incorreta", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("adminLoggedIn");
    setPassword("");
    toast({ title: "Desconectado com sucesso" });
  };

  const handleAddCourse = () => {
    if (!newCourse.title || !newCourse.description) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setCourses([
      ...courses,
      {
        id: Date.now().toString(),
        title: newCourse.title,
        description: newCourse.description,
        level: newCourse.level,
      },
    ]);

    setNewCourse({ title: "", description: "", level: "intermediário" });
    toast({ title: "Curso adicionado!" });
  };

  const handleUpdateCourse = () => {
    if (!editingCourse.title || !editingCourse.description) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setCourses(
      courses.map((c) => (c.id === editingCourse.id ? editingCourse : c))
    );
    setEditingCourse(null);
    toast({ title: "Curso atualizado!" });
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
    toast({ title: "Curso removido" });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
        <Card className="w-full max-w-md bg-[#1a1d24] border-[#2d3748]">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-indigo-600 text-white">
                <Lock className="w-6 h-6" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Painel Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Senha de Administrador</Label>
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0f1117] border-[#2d3748]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Senha de demo: <code className="bg-secondary/30 px-2 py-1 rounded">admin123</code>
                </p>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                Entrar como Admin
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <BookOpen className="w-6 h-6" />
            </span>
            Painel de Administração
          </h1>
          <p className="text-muted-foreground">Gerencie seus cursos e conteúdo</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-[#2d3748] text-red-400 hover:bg-red-600/10"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>

      {/* Add Course Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Curso
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#1a1d24] border-[#2d3748]">
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                className="bg-[#0f1117] border-[#2d3748]"
                placeholder="Ex: React Avançado"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                className="bg-[#0f1117] border-[#2d3748] resize-none h-24"
                placeholder="Descreva o curso..."
              />
            </div>
            <div className="space-y-2">
              <Label>Nível</Label>
              <select
                value={newCourse.level}
                onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as any })}
                className="w-full bg-[#0f1117] border border-[#2d3748] text-white rounded-lg p-2"
              >
                <option value="iniciante">Iniciante</option>
                <option value="intermediário">Intermediário</option>
                <option value="avançado">Avançado</option>
              </select>
            </div>
            <Button
              onClick={handleAddCourse}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Criar Curso
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Courses Table */}
      <Card className="bg-[#1a1d24] border-[#2d3748] overflow-hidden">
        <CardHeader>
          <CardTitle>Meus Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-[#0f1117] border border-[#2d3748] p-4 rounded-lg flex items-center justify-between hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{course.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{course.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded">
                      {course.level}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCourse(course)}
                        className="border-[#2d3748] text-blue-400 hover:bg-blue-600/10"
                      >
                        <Edit2 className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1a1d24] border-[#2d3748]">
                      <DialogHeader>
                        <DialogTitle>Editar Curso</DialogTitle>
                      </DialogHeader>
                      {editingCourse && (
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                              value={editingCourse.title}
                              onChange={(e) =>
                                setEditingCourse({ ...editingCourse, title: e.target.value })
                              }
                              className="bg-[#0f1117] border-[#2d3748]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                              value={editingCourse.description}
                              onChange={(e) =>
                                setEditingCourse({ ...editingCourse, description: e.target.value })
                              }
                              className="bg-[#0f1117] border-[#2d3748] resize-none h-24"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nível</Label>
                            <select
                              value={editingCourse.level}
                              onChange={(e) =>
                                setEditingCourse({ ...editingCourse, level: e.target.value })
                              }
                              className="w-full bg-[#0f1117] border border-[#2d3748] text-white rounded-lg p-2"
                            >
                              <option value="iniciante">Iniciante</option>
                              <option value="intermediário">Intermediário</option>
                              <option value="avançado">Avançado</option>
                            </select>
                          </div>
                          <Button
                            onClick={handleUpdateCourse}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Salvar Alterações
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="border-[#2d3748] text-red-400 hover:bg-red-600/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Deletar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Videos Management Card */}
      <Card className="bg-[#1a1d24] border-[#2d3748]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Gerenciar Vídeos por Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Para adicionar/editar vídeos de um curso, clique em "Editar" no curso e configure os módulos e aulas.
          </p>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Video className="w-4 h-4 mr-2" /> Gerenciar Vídeos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
