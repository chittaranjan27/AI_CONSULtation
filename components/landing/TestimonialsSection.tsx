"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CEO, TechFlow Solutions",
    avatar: "SJ",
    content:
      "Brahma Graha transformed our lead generation. Our AI chatbot captures 3x more qualified leads than our old contact forms. The analytics dashboard is incredibly insightful.",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    role: "Founder, DigitalFirst India",
    avatar: "RK",
    content:
      "The multilingual support is a game-changer for our Indian market. Our chatbot handles Hindi, Tamil, and English conversations seamlessly. Setup took less than an hour.",
    rating: 5,
  },
  {
    name: "Emily Chen",
    role: "Marketing Director, ScaleUp AI",
    avatar: "EC",
    content:
      "The workflow builder is brilliant. We created a complete consultation flow that qualifies leads, books appointments, and syncs with our CRM — all without writing code.",
    rating: 5,
  },
  {
    name: "Michael Torres",
    role: "CTO, Enterprise Solutions Co",
    avatar: "MT",
    content:
      "What sold us was the multi-provider support. We use Anthropic for complex queries and GPT-4o for quick responses. The failover mechanism means zero downtime.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "Head of Growth, HealthTech Pro",
    avatar: "AP",
    content:
      "We trained the AI on our medical knowledge base and it provides accurate, contextual responses. The RAG system is incredibly good. Patient engagement jumped 40%.",
    rating: 5,
  },
  {
    name: "David Wilson",
    role: "Agency Owner, WebCraft Agency",
    avatar: "DW",
    content:
      "The white-label feature lets us offer AI chatbots under our brand. We're now reselling the platform to 20+ clients. Best ROI investment we've made this year.",
    rating: 5,
  },
];

const gradients = [
  "from-purple-500 to-blue-500",
  "from-blue-500 to-cyan-500",
  "from-cyan-500 to-emerald-500",
  "from-pink-500 to-purple-500",
  "from-amber-500 to-pink-500",
  "from-emerald-500 to-blue-500",
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section relative" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="badge badge-pink mb-4">Testimonials</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Loved by{" "}
            <span className="gradient-text-pink">Businesses Worldwide</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            See what our customers have to say about transforming their
            business with AI-powered consultations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div className="glass-card p-6 h-full hover:transform-none">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-500 text-amber-500"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-primary)]">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradients[index]} flex items-center justify-center text-sm font-bold text-white`}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
