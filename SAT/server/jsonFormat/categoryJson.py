class CategoryJson:
    def __init__(self):
        self.id = None
        self.name = None
        self.super_category = None

    def set_id(self, id: int):
        self.id = id

    def set_name(self, name: str):
        self.name = name

    def set_super_category(self, super_category: str):
        self.super_category = super_category

    def to_json(self):
        assert self.id is not None, "id is not set"
        assert self.name is not None, "name is not set"
        assert self.super_category is not None, "super_category is not set"
        return {
            "id": self.id,
            "name": self.name,
            "supercategory": self.super_category,
        }
