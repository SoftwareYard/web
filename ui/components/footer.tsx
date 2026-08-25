"use client"

import Link from "next/link"
import { Facebook, Instagram, Linkedin, Mail, MapPin, Clock } from "lucide-react"

const footerLinks = {
  company: [
    { label: "About Us", href: "#about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "#contact" },
  ],
}

const contactInfo = [
  { icon: Mail, value: "contact@softwareyard.co", href: "mailto:contact@softwareyard.co" },
  { icon: MapPin, value: "Bitola, North Macedonia", href: null },
  { icon: Clock, value: "Mon - Fri, 10:00 - 18:00 CET", href: null },
]

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/softwareyardmk" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/softwareyard/?hl=en" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/software-yard/" },
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
            <a
              href="#services"
              className="text-background/60 hover:text-background transition-colors text-sm"
            >
              Our Services
            </a>
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

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3">
              {contactInfo.map((item) => (
                <li key={item.value} className="flex items-start gap-2 text-sm text-background/60">
                  <item.icon className="w-4 h-4 mt-0.5 shrink-0" />
                  {item.href ? (
                    <a href={item.href} className="hover:text-background transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <span>{item.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 text-center">
          <p className="text-background/40 text-sm">
            &copy; {new Date().getFullYear()} SoftwareYard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
