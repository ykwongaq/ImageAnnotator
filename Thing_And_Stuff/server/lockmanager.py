import threading


class LockManager:
    def __init__(self):
        self.locks = {}

    def get_lock(self, key):
        # Dynamically create a lock if it doesn't exist
        if key not in self.locks:
            self.locks[key] = threading.Lock()
        return self.locks[key]

    def with_lock(self, key):
        """Decorator to run a function with a specific lock."""

        def decorator(func):
            def wrapper(*args, **kwargs):
                lock = self.get_lock(key)
                with lock:
                    return func(*args, **kwargs)

            return wrapper

        return decorator
