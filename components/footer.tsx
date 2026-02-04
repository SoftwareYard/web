"use client"

import Link from "next/link"
import { Facebook, Instagram, Linkedin, ArrowUpRight } from "lucide-react"

const footerLinks = {
  services: [
    { label: "Digital Transformation", href: "#" },
    { label: "App Development", href: "#" },
    { label: "Cloud Solutions", href: "#" },
    { label: "Quality Assurance", href: "#" },
  ],
  company: [
    { label: "About Us", href: "#about" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#contact" },
  ],
  resources: [
    { label: "Blog", href: "#" },
    { label: "Case Studies", href: "#" },
    { label: "Documentation", href: "#" },
    { label: "Support", href: "#" },
  ],
}

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Main footer content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-background/10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                <span className="text-foreground font-bold text-lg">SY</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-background">
                SoftwareYard
              </span>
            </Link>
            <p className="text-background/60 leading-relaxed mb-6 max-w-sm">
              Transform your business with cutting-edge software solutions. We build
              scalable, user-friendly applications that drive growth and innovation.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-background mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/60 hover:text-background transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/60 hover:text-background transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-background mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/60 hover:text-background transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="py-12 border-b border-background/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="font-semibold text-background mb-2">
                Subscribe to our newsletter
              </h4>
              <p className="text-background/60 text-sm">
                Get the latest updates and insights delivered to your inbox.
              </p>
            </div>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 rounded-full bg-background/10 border border-background/20 text-background placeholder:text-background/40 focus:outline-none focus:border-background/40 w-64"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-background text-foreground font-medium hover:bg-background/90 transition-colors flex items-center gap-2"
              >
                Subscribe
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-background/40 text-sm">
            &copy; {new Date().getFullYear()} SoftwareYard. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-background/40 hover:text-background text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-background/40 hover:text-background text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-background/40 hover:text-background text-sm transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
