---
author: Vitor Albres
pubDatetime: 2024-12-30T19:30:00Z
title: "ThreadPool: A Pool Like You've Never Seen!"
slug: thread-pool-deep-dive
featured: true
draft: false
tags:
  - multithreading
  - performance
  - backend
description: "Everything you need to know about ThreadPools and how they help high-scale systems handle massive workloads efficiently."
---

Before we dive into what a ThreadPool is and how it helps your systems handle the heavy load that's been causing headaches lately, we first need to go back to the basics: explaining what a **Thread** is!

First off, no, it's not the kind of "thread" you see on social media. We're talking about the computing universe. This concept is increasingly present in the vocabulary of developers, especially those dealing with giant systems and thousands of processes or requests.

The word **Thread** refers to a line or sequence of execution. We can say a thread is a small set of instructions that works as a sub-system, enabling a single process to be divided into two or more tasks that can be executed concurrently. In short: a thread is a little place responsible for executing a specific task.

## Multi-threading: More Than One Task at a Time

Knowing what a thread is, we can move to **Multi-threading**.

In computers with only one CPU (single core), you could theoretically only execute one thread at a time. Imagine an office with only one desk shared by two people. How would that work in a computational context? Basically, person A and person B would trade off using the desk and the materials on top of it, with a supervisor controlling the time allotted to each. These swaps are so fast that it feels like both tasks are running in parallel, but they aren't!

However, thanks to technological advances, even the most basic processors today have multiple cores. This makes it possible for more than one thread to be executed simultaneously—after all, more cores mean more "desks."

### User-level vs. Kernel-level

Threads can be created at two main levels: **Kernel-level Thread (KTL)** or **User-level Thread (UTL)**.

UTL threads are created through programming language libraries. These libraries are responsible for creating, managing, and destroying threads. In our desk analogy, the supervisor (Kernel) isn't aware of how many people the library is managing; from the supervisor's perspective, it just sees one person at a time at the desk. This allows our application to have thousands of open threads without consuming too many system resources.

## The Cherry on Top: ThreadPool 🍒

Where does the **ThreadPool** fit into all this?

In programming, a ThreadPool is a design pattern aimed at achieving concurrency. It allows us to parallelize task execution by keeping multiple threads open and waiting for tasks to be allocated.

By doing this, application performance increases and execution latency decreases because the overhead costs of opening and closing threads are centralized. When a new task arrives, the time that would have been spent creating a new thread is eliminated, resulting in a responsive and stable system.
### Configuration and Best Practices

The number of threads in a pool can be configured manually, but this should be done with caution. Creating too many unused threads is a waste of resources. The recommendation is to use dynamic modes to maintain an ideal number of threads, usually with some upper limit to prevent the machine's resources from being completely exhausted.

Depending on your system's architecture, it's often more efficient to have a pool with many threads executing short tasks than few threads executing very long tasks.

## Real-world Examples

### Code-level Parallelization
Imagine you have a list of 1 million values and want to add +1 to each. Doing this sequentially takes time. With multiple threads, you can divide the work and run the additions in parallel. Using a ThreadPool here gains you performance while saving the resources normally spent on manual thread lifecycle management.

### API-level Parallelization
Imagine those 1 million values are in a remote database and need to be called via HTTP requests. Making calls one by one is unfeasible. We can use different threads to execute multiple requests simultaneously, significantly cutting down on wait time.

## A Practical Example in Python

Using Python's `multiprocessing` library, we can easily work with a ThreadPool:

```python
from multiprocessing.pool import ThreadPool
import time

def sleepy_task(seconds):
    print(f"Waiting for {seconds} seconds...")
    time.sleep(seconds)
    return f"Done after {seconds}s"

# Creating a pool with 2 distinct threads
with ThreadPool(processes=2) as pool:
    # Allocating tasks
    async_result = pool.apply_async(sleepy_task, (2,))
    
    # Do other work here...
    
    print(async_result.get())
```

While this example is in Python, many other languages like **C#** or **Go** have native support for similar structures (like C#'s `System.Threading.ThreadPool`).

## Conclusion

Can you see the power that multi-threading gives us? While you *could* manage threads manually, using a **ThreadPool** abstracts the complexity, giving you precise, granular control over your application's performance.

Now that you've had a taste of how this world of threads can boost your application's performance, what are you waiting for? Go deeper and happy coding!

---

*Special thanks to Renan Marcos Ferreira for explaining many of these details!*

### References
- [User and Kernel Level Threads](http://www.cs.iit.edu/~cs561/cs450/ChilkuriDineshThreads/dinesh's%20files/User%20and%20Kernel%20Level%20Threads.html)
- [What is a Thread? - Canaltech (PT-BR)](https://canaltech.com.br/software/o-que-e-thread/)
- [Fabio Akita - Entendendo Threads (Video)](https://www.youtube.com/watch?v=cx1ULv4wYxM)
