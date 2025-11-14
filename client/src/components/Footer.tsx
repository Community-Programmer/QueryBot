import { Database, Github, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground/5 border-t border-border py-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">Querybot</span>
          </div>

          {/* Creators Section */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-8">
              {/* Sarthak Patel */}
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="flex flex-col items-start">
                  <div className="text-sm font-semibold text-foreground">Sarthak Patel</div>
                  <div className="text-xs text-muted-foreground">Developer</div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href="https://www.linkedin.com/in/sarthak-patel23/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-md bg-foreground/5 hover:bg-blue-500/10 hover:text-blue-500 flex items-center justify-center transition-all duration-200"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://github.com/Community-Programmer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-md bg-foreground/5 hover:bg-gray-800/10 hover:text-gray-800 flex items-center justify-center transition-all duration-200"
                    title="GitHub"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Separator */}
              <div className="hidden sm:block w-px bg-border self-stretch"></div>

              {/* Vedika Pande */}
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="flex flex-col items-start">
                  <div className="text-sm font-semibold text-foreground">Vedika Pande</div>
                  <div className="text-xs text-muted-foreground">Developer</div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href="https://www.linkedin.com/in/vedika-pande/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-md bg-foreground/5 hover:bg-blue-500/10 hover:text-blue-500 flex items-center justify-center transition-all duration-200"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://github.com/VedikaPande"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-md bg-foreground/5 hover:bg-gray-800/10 hover:text-gray-800 flex items-center justify-center transition-all duration-200"
                    title="GitHub"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#workflow" className="text-muted-foreground hover:text-primary transition-colors">
              How it Works
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 mt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>© 2025 Querybot • Transform your data into insights</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
